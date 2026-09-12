function navigate(url) {
    console.log('navigating to ' + url)
    window.location.href = url;
}

let cartItems = +document.getElementById('cart-icon').style.getPropertyValue('--items');
updateCartItemDisplay();
function updateCartItemDisplay() {
    const el = document.getElementById('cart-icon');

    el.style.setProperty('--items', `'${cartItems < 10 ? cartItems : '9+'}'`);
    el.classList.toggle('no-item', cartItems === 0);
}

// HTML syntax highlight doesn't really like jinja variable injection (by using {{ exp... }}), so instead use this
// E.g.: <element onclick="naviageAttr(this)" data-href="/test.html"
function navigateAttr(e) {
    navigate(e.dataset.href);
}
function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
}

const lleData = [
    [
        "Magyar",       // Magyarország
        "English",      // Angol
        "Deutsch",      // Ausztria
        "Slovenčina",   // Szlovákia
        "Українська",   // Ukrajna
        "Română",       // Románia
        "Српски",       // Szerbia
        "Hrvatski",     // Horvátország
        "Slovenščina"   // Szlovénia
    ], [
        "Magyarország",
        "Egyesült királyság",
        "Ausztria",
        "Szlovákia",
        "Ukrajna",
        "Románia",
        "Szerbia",
        "Horvátország",
        "Szlovénia"
    ], [
        "Forint (HUF)",     // Magyarország
        "Angol font (GBP)", // Anglia
        "Euró (EUR)",       // Sztandardish
        "Hrivnya (UAH)",    // Ukrajna
        "Leu (RON)",        // Románia
        "Dínár (RSD)",      // Szerbia
    ]
];

let prefsStorage = window.localStorage.getItem('prefs');
let prefs = [0, 0, 0]
if (prefsStorage !== null)
    prefs = prefsStorage.split(',');
else
    window.localStorage.setItem('prefs', prefs);

['lang-selection', 'country-selection', 'currency-selection'].forEach((id, i) => {
    const el = document.getElementById(id);
    const cont = el.querySelector('.dropup');

    el.firstElementChild.textContent = lleData[i][prefs[i]];
    el.addEventListener('click', (e) => {
        lleClick(el, e);
    });

    lleData[i].forEach((v, j) => {
        const sp = document.createElement('span');
        sp.textContent = v;
        sp.addEventListener('click', () => {
            sp.parentElement.parentElement.firstElementChild.textContent = sp.textContent;
            prefs[i] = j;
            window.localStorage.setItem('prefs', prefs);
        });
        cont.appendChild(sp);
    });
});

let selectedLle;
window.addEventListener('click', (e) => {
    if (selectedLle !== undefined) {
        e.stopPropagation();
        closeLle();
    }
});
function lleClick(e, event) {
    event.stopPropagation();

    if (selectedLle !== undefined)
        selectedLle.classList.remove('active');

    if (selectedLle === e) {
        closeLle();
        return;
    }

    selectedLle = e;
    e.classList.add('active');
}
function closeLle() {
    if (selectedLle === undefined)
        return;

    selectedLle.classList.remove('active');
    selectedLle = undefined;
}

quantities = []
const quantityIncrement = (t) => _changeQuantity(t, 1);
const quantityDecrement = (t) => _changeQuantity(t, -1);

function quantityInputted(e) {
    id = e.id.split('_')[1];

    quantities[id] = e.value;
}
function _changeQuantity(e, v) {
    id = e.dataset.relation;
    if (quantities[id] === undefined)
        quantities[id] = 1;
    const f = document.getElementById('quantity-txt_' + id);
    if (f.value == '')
        f.value = 1;
    quantities[id] = clamp(new Number(quantities[id]) + v, f.min, f.max);
    f.value = quantities[id];
}

document.querySelectorAll('.quantity-container input').forEach(q => {
    quantityInputted(q);
});

const nav = document.querySelector('nav');
function openSideMenu() {
    nav.classList.toggle('side', true);
}
function closeSideMenu() {
    nav.classList.toggle('side', false);
}

document.getElementById('search-bar').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSearch(); });
document.querySelector('#search-bar + i').addEventListener('click', () => handleSearch());
function handleSearch() {
    const v = document.getElementById('search-bar').value.trim();

    if (v === '')
        return;

    navigate(`/kereses?q=${encodeURIComponent(v)}`)
}

// Register a dropdown
// changeCB is the callback, (value, element)
function registerDropdown(id, changeCB) {
    // This is the .dropdown-contaienr
    const dropdown = document.getElementById(id);
    const displayValue = dropdown.querySelector('.dropdown-value');
    const dropdownFields = dropdown.querySelector('.dropdown');

    // When we click the dropdown
    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();

        const isActive = dropdown.classList.contains('active');
        dropdown.classList.toggle('active', !isActive);
    });
    window.addEventListener('click', (e) => {
        if (!dropdown.classList.contains('active'))
            return;
        e.stopPropagation();

        dropdown.classList.toggle('active', false);
    });

    dropdownFields.querySelectorAll('span').forEach(e => {
        e.addEventListener('click', () => {
            displayValue.textContent = e.textContent;

            dropdownFields.querySelectorAll('.active').forEach(e => e.classList.remove('active'));
            e.classList.add('active');

            changeCB(e.dataset.value, e);
        });
    });
}

// MODALS
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const modalOkBtn = document.getElementById('ok-btn');
const modalCancelBtn = document.getElementById('cancel-btn');
const modalYesBtn = document.getElementById('yes-btn');
const modalNoBtn = document.getElementById('no-btn');

const ModalButtons = Object.freeze({
    OK: 1 << 0,
    CANCEL: 1 << 1,
    YES: 1 << 2,
    NO: 1 << 3
});

let modalCallback = null;

[modalOkBtn, modalCancelBtn, modalNoBtn, modalYesBtn].forEach(b => b.addEventListener('click', () => {
    if (modalCallback !== null)
        modalCallback(b.id.split('-')[0]);

    closeModal();
}));

function showModal(title, body, buttons, callback) {
    modal.classList.add('active');
    modalTitle.textContent = title;
    modalContent.textContent = body;
    modalCallback = callback;

    modalOkBtn.classList.toggle('hidden', (buttons & ModalButtons.OK) !== ModalButtons.OK);
    modalCancelBtn.classList.toggle('hidden', (buttons & ModalButtons.CANCEL) !== ModalButtons.CANCEL);
    modalYesBtn.classList.toggle('hidden', (buttons & ModalButtons.YES) !== ModalButtons.YES);
    modalNoBtn.classList.toggle('hidden', (buttons & ModalButtons.NO) !== ModalButtons.NO);
}

function closeModal() {
    modal.classList.remove('active');
    modalCallback = null;
}

// NOTIFICATIONS
const notification = document.getElementById('notification');
const notificationText = notification.querySelector('span');

function showNotification(text, error = false) {
    notification.classList.add('active');
    notification.classList.toggle('error', error);
    notificationText.textContent = text;

    setTimeout(hideNotification, 4000);
}

function hideNotification() {
    notification.classList.remove('active');
}


function formatNumber(n) {
    return new Intl.NumberFormat('en', {
        style: 'decimal',
        useGrouping: true
    }).format(n).replace(/,/g, ' ')
}