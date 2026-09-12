let selectedSize = '';
let selectedColor = '';
const mainImg = document.getElementById('main-img');
const colorDisplay = document.getElementById('color');
const sizeDisplay = document.getElementById('size');

// Select first ones
colorSelected(document.getElementById('color-list').firstElementChild);

const sizeList = document.getElementById('size-list');
if (sizeList !== null)
    sizeSelected(sizeList.firstElementChild);

function colorSelected(el) {
    // Remove previous selection
    document.querySelectorAll('#color-list .active').forEach(e => e.classList.remove('active'));
    el.classList.add('active');

    selectedColor = el.dataset.colorId;
    updateSelectedColor();
}
function updateSelectedColor() {
    const active = document.querySelector('#color-list .active');

    // No color is selected     ¯\_(ツ)_/¯
    if (active === undefined)
        return;

    mainImg.src = active.dataset.path;
    colorDisplay.textContent = active.dataset.displayText;
}
function sizeSelected(el) {
    // Remove previous selection
    document.querySelectorAll('#size-list .active').forEach(e => e.classList.remove('active'));
    el.classList.add('active');

    selectedSize = el.dataset.sizeId;
    updateSelectedSize();
}
function updateSelectedSize() {
    // No sizes are defined for this item
    if (sizeDisplay === undefined)
        return;

    const active = document.querySelector('#size-list .active');

    // No size is selected      ¯\_(ツ)_/¯
    if (active === undefined)
        return;

    sizeDisplay.textContent = active.dataset.sizeId;
}

function addToCart(id) {
    fetch('/api/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
            id: id,
            color: selectedColor,
            size: selectedSize,
            quantity: quantities[0] ?? 1
        })
    })
    .then(r => {
        if(r.ok) {
            showNotification('A termék a kosárba került.');
            cartItems++;
            updateCartItemDisplay();
        }
        else
            showNotification('Nem sikerült hozzáadni a kosárhoz!', true);
    })
    .catch(error => console.error(error));
}