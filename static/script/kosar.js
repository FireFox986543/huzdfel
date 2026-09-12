const cart = document.getElementById('cart');

function askClearCart() {
    showModal('Biztosan kiüríti a kosarat?', 'A kosár ürítése végleges, nem lehet visszavonni. Az összes termék kitörlődik, később ugyanúgy visszaadhatja.', ModalButtons.YES | ModalButtons.NO, (r) => {
        if (r === 'yes')
            clearCart();
    });
}

function clearCart() {
    fetch('/api/clear_cart')
        .then(r => {
            if (r.ok) {
                console.log('Cart cleared!');
                showNotification('A kosár tartalma kiürült!');
                location.reload();
            }
            else
                showNotification('Nem sikerült kiüríteni a kosár tartalmát!', true);
        })
        .catch(error => {
            console.error(error);
        });
}

function removeItem(e) {
    const index = Array.from(cart.children).indexOf(e.parentNode);
    fetch('/api/remove?v=' + index)
        .then(r => {
            if (!r.ok)
                showNotification('Nem sikerült kitörölni a terméket!', true);
            else {
                let aa = cart.children.length;
                e.parentElement.remove();

                cartItems--;
                updateCartItemDisplay();
                calculatePrice();

                if (aa == 1)
                    location.reload();
            }
        })
        .catch(error => {
            console.error(error);
        });
}

function handleDisplay(idx) {
    const display = document.getElementById('price-display_' + idx);
    display.textContent = formatNumber(+display.dataset.price * quantities[idx]) + ',- Ft';

    // Register quantity change for server
    fetch('/api/change', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UFT-8'
        },
        body: JSON.stringify({
            index: idx,
            quantity: quantities[idx]
        })
    })
    .catch(error => console.error(error));

    calculatePrice();
}

document.querySelectorAll('.quantity-container button').forEach(q => q.addEventListener('click', () => {
    const idx = q.dataset.relation;

    handleDisplay(idx);
}));
document.querySelectorAll('.quantity-container input').forEach(i => i.addEventListener('blur', () => {
    const idx = i.id.split('_')[1];
    i.value = clamp(i.value, 1, 20);
    quantities[idx] = i.value

    handleDisplay(idx);
}));

if(document.getElementById('full-price') !== null)
    calculatePrice();
function calculatePrice() {
    let total = 0;

    document.querySelectorAll('.quantity-container input').forEach(i => {
        const idx = i.id.split('_')[1];
        const display = document.getElementById('price-display_' + idx);

        total += quantities[idx] * display.dataset.price;
    });

    document.getElementById('full-price').textContent = `${formatNumber(total)},- Ft`;
    document.getElementById('raw-price').textContent = `${formatNumber((total * .73).toFixed(2))},- Ft`;
}