let qParam, cParam, sParam, oParam, cvParam;
//  q  ->  Search query
//  c  ->  Category number
//  s  ->  Color number
//  o  ->  Sort string
//  cv ->  Are we viewing a category?
setCurrentParams();

// We'll inject the search results into this container
const resultsContainer = document.getElementById('load-content');
// The searchbar in the navigation place
const searchBar = document.getElementById('search-bar');

// Elements for category or color selection, button or checkbox
let categoryElements, colorElements;

// Convert to category and color numbers
// Has 'category' and 'color' properties
let convertTable;

const sortBtn = document.getElementById('sort-dropdown');
let sortMode = 'az';

// Get the suffix from the webpage when it loads
const suffix = '– ' + document.title.split('–')[1];

if (!cvParam) { // If not viewing a category
    // Use callback, when fetching tables finished, then subscribe filter buttons, as it depends on conversion
    fetchConvertTable(subscribeFilterBtns);

    // Override default search handling
    handleSearch = function (historyMode = 1) {
        const value = searchBar.value.trim();

        // Nothing is written inside the searchbar, or it has more characters than allowed
        if (value === '' || value.length > searchBar.maxlegth) return;

        updateParamsFromFilters();
        qParam = encodeURIComponent(value);

        document.title = value + ' ' + suffix;

        requestSearch(historyMode);
    }

    // Add a popstate listener to the window, this will catch going between history, and display the page as it would've been
    window.addEventListener('popstate', () => {
        setCurrentParams();
        searchBar.value = qParam;
        updateSelections();
        requestSearch(0);
    });
}

// 0 is required here, as we don't want to push history when the page first loads
requestSearch(0);

// Initialize custom dropdown
registerDropdown('sort-dropdown', (v) => {
    sortMode = v;
    
    if (cvParam) {
        // When viewing a category handle this case specially
        updateParamsFromFilters();
        requestSearch(2);
        return;
    }

    // Replace the current history state
    handleSearch(2);
});

function setCurrentParams() {
    const params = new URLSearchParams(window.location.search);
    qParam = params.get('q') ?? '';
    cParam = params.get('c') ?? 0;
    sParam = params.get('s') ?? 0;
    oParam = params.get('o') ?? '';
    cvParam = params.get('v') ?? false;
}
function updateParamsFromFilters() {
    // Only get filters if we aren't viewing a category
    if (!cvParam) {
        const categories = [], colors = [];
        getSelectedFilters(categories, colors);

        // Set search params from the selected categories/colors
        cParam = convertFromCategories(categories);
        sParam = convertFromColors(colors);
    }
    else {
        // If we're only viewing a category, we don't need these extra parameters
        sParam = 0;
    }

    oParam = sortMode;
}

// This will add the necessary event listeners to the filter buttons to make them work
function subscribeFilterBtns() {
    // Get all checkboxes from the category panel, these require the 'change' listener
    categoryElements = document.getElementById('category-panel').querySelectorAll('input[type="checkbox"');
    // Get all buttons from the color panel, these require the 'click' listener
    colorElements = document.getElementById('color-panel').querySelectorAll('button');

    // These functions will handle the click of each button/cb
    const categoryClicked = function (e) {
        categoryElements.forEach(el => {
            if(el !== e)
                el.checked = false;
        });

        // There's no need to add another history record just for changing a couple of filters
        handleSearch(2);
    };
    const colorClicked = function (e) {
        const actives = Array.from(colorElements).filter(e => e.classList.contains('active'))
        const last = actives.length > 0 ? actives[0] : undefined;
        actives.forEach(e => e.classList.remove('active'));

        // If no color is selected, toggle this on
        // and if we click on this again, then remove the selection from this
        if(last === undefined || last !== e)
            e.classList.toggle('active');

        // There's no need to add another history record just for changing a couple of filters
        handleSearch(2);
    };

    updateSelections();

    categoryElements.forEach(e => e.addEventListener('change', () => categoryClicked(e)));
    colorElements.forEach(e => e.addEventListener('click', () => colorClicked(e)));
}
function updateSelections() {
    let selectedCategories = [], selectedColors = [];

    if (cParam !== 0)
        selectedCategories = convertToCategories(cParam);
    if (sParam !== 0)
        selectedColors = convertToColors(sParam);

    categoryElements.forEach(e => {
        e.checked = selectedCategories.includes(e.id);
    });
    colorElements.forEach(e => {
        e.classList.toggle('active', selectedColors.includes(e.id));
    });
}

function getSelectedFilters(categoryList, colorList) {
    categoryElements.forEach(e => {
        if (e.checked)
            categoryList.push(e.id);
    });
    colorElements.forEach(e => {
        if (e.classList.contains('active'))
            colorList.push(e.id);
    });
}
function requestSearch(historyMode = 1) {
    if (window.location.search === '') {
        console.error('Search params cannot be empty for this page!');
        return;
    }

    let base = 'kereses?embed=a';

    if (cvParam)
        base += '&v=True'
    if (qParam !== '')
        base += '&q=' + qParam;
    if (cParam !== 0)
        base += '&c=' + cParam;
    if (sParam !== 0)
        base += '&s=' + sParam;
    if (oParam !== '')
        base += '&o=' + oParam;

    if (historyMode == 1)
        window.history.pushState({}, '', base.replace('embed=a&', ''));
    else if (historyMode == 2)
        window.history.replaceState(null, '', base.replace('embed=a&', ''));

    fetch(base)
        .then(r => {
            if (!r.ok) {
                alert('Nem sikerült betölteni a keresést! Próbálja meg újrá később.');
                console.error(`Failed to get search! (${r.status}), ${r.statusText}.`);
                return;
            }

            return r.text();
        })
        .then(html => {
            resultsContainer.innerHTML = html;
        })
        .catch(error => {
            console.error(error);
        });
}

function fetchConvertTable(callback) {
    fetch('/api/tables')
        .then(r => {
            if (!r.ok) {
                showModal('HIBA!', 'Nem sikerült betölteni a megfelelő forrásokat. Probálja meg újra később!', ModalButtons.OK, () => {});
                console.error(`Failed to load convert tables! (${r.status}), ${r.statusText}!`);
                return;
            }

            return r.json();
        })
        .then(table => {
            convertTable = table;

            if (callback)
                callback();
        })
        .catch(err => {
            console.error('Error while trying to fetch convert tables: ' + err);
        });
}
function _convertFromTable(type, values) {
    let total = 0;
    values.forEach(v => total += 1 << convertTable[type].indexOf(v));
    return total;
}
function _convertToTable(type, value) {
    const values = [];
    convertTable[type].forEach((v, i) => {
        if (1 << i & value)
            values.push(v);
    });
    return values;
}
function convertFromCategories(values) {
    return _convertFromTable('category', values);
}
function convertFromColors(values) {
    return _convertFromTable('color', values);
}
function convertToCategories(value) {
    return _convertToTable('category', value);
}
function convertToColors(value) {
    return _convertToTable('color', value);
}