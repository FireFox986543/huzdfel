function selectThis(e) {
    document.querySelectorAll('.cb-row').forEach(i => {
        i.classList.toggle('active', i == e);
    });

    const cardOn = e.dataset.mode === undefined;
    document.getElementById('cc-card').classList.toggle('opened', e.dataset.mode === undefined);
    document.querySelectorAll('#cc-card input').forEach(i => i.required = cardOn);
}

document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    const selectedPaymentMode = document.querySelector('.cb-row.active');
    if (selectedPaymentMode === null) {
        showNotification('Kérem válasszon egy fizetési módót.', true);
        return;
    }

    const isUtanvet = selectedPaymentMode.dataset.mode === 'utanvet';

    nameValue = document.getElementById('name').value.trim();
    emailValue = document.getElementById('email').value.trim();
    phoneValue = document.getElementById('phone').value.trim();
    zipValue = +document.getElementById('zipcode').value.trim();
    placeValue = document.getElementById('place').value.trim();
    streetValue = document.getElementById('street').value.trim();

    cardValue = document.getElementById('card').value.trim();
    cardExpValue = document.getElementById('exp').value.trim();
    cardCVCValue = document.getElementById('cvc').value.trim();
    cardNameValue = document.getElementById('cardname').value.trim();

    if (Number.isNaN(zipValue) || nameValue == '' || emailValue == '' || phoneValue == '' || zipValue < 1000 || placeValue == '' || streetValue == '' || (!isUtanvet && (cardValue == '' || cardCVCValue == '' || cardExpValue == '' || cardNameValue == ''))) {
        showNotification('Kérem töltse ki az összes mezőt.', true);
        return;
    }

    window.localStorage.setItem('order', JSON.stringify({
        name: nameValue,
        email: emailValue,
        phone: phoneValue,
        zip: zipValue,
        place: placeValue,
        street: streetValue,
        utanvet: isUtanvet,
        card: cardValue,
        cardexp: cardExpValue,
        cardcvc: cardCVCValue,
        cardname: cardNameValue
    }));

    if (selectedPaymentMode.dataset.mode === 'utanvet')
        navigate('/megrendeles?u=true');
    else
        navigate('/megrendeles');
});

document.getElementById('zipcode').addEventListener('input', () => {
    const value = +document.getElementById('zipcode').value.trim();

    if(!Number.isNaN(value) && value >= 1_000 && value < 10_000) {
        fetch('/api/zip?v=' + value)
        .then(r => r.json())
        .then(r => {
            if (r.status !== 'error')
                document.getElementById('place').value = r.result[0].name
        });
    }
})