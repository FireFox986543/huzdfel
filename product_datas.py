import os
import random
import json

def initialize():
    global TYPES, PATHS, PRODUCTS
    TYPES = load_types()
    PATHS = load_paths()
    PRODUCTS = load_products()

def load_types():
    """
    Loads type metadata from database.
    """
    with open(os.path.join(os.getcwd(), 'database/types.json'), 'r', encoding='utf-8') as f:
        return json.load(f)
    
def get_type_info(id: str | None):
    if not id:
        return None
    
    product = get_product(id)
    
    if not product:
        return None
    
    return TYPES.get(product.get('type'))

def load_products():
    """
    Loads all products from the database.
    """
    trademarks = None
    products = []
    
    with open(os.path.join(os.getcwd(), 'database/termekek.json'), 'r', encoding='utf-8') as f:
        trademarks = json.load(f)
        
    for tm in trademarks:
        name = tm['name']
        
        for p in tm['products']:
            p['trademark'] = name
            products.append(p)
    
    return products

def load_paths():
    """
    Constructs a list of paths for the menu.
    """
    paths: dict = dict()
    
    for t in TYPES:
        o = TYPES[t]
        
        if paths.get(o['path'][0], None) != None and paths[o['path'][0]].get(o['path'][1], None) == None:
            paths[o['path'][0]][o['path'][1]] = t
        else:
            paths[o['path'][0]] = {
                o['path'][1]: t
            }
    
    return paths

def get_product(id: str | None, default = None):
    if not id:
        return None
    
    return next((p for p in PRODUCTS if p['id'] == id), default)

def get_all_from_cat(cat: str):
    return [x for x in PRODUCTS if x['type'] == cat]

def fill_list(target: int, cat: str):
    products = get_all_from_cat(cat)
    random.shuffle(products)
    
    if len(products) >= target:
        stripped = products[:target]
        ret = []
        
        for s in stripped:
            ret.append({
                'id': s['id'],
                'name': s['name'],
                'price': s['variants'][0].get('priceOverride', s['price']),
                'trademark': s['trademark'],
                'path': s['variants'][0]['path']
            })
            
        random.shuffle(ret)
        return ret
    else:
        result = []
        max_len = max(len(p['variants']) for p in products)

        for i in range(max_len):
            for p in products:
                if i < len(p['variants']):
                    variant = p['variants'][i]            
                    result.append({
                        'id': p['id'],
                        'name': p['name'],
                        'price': variant.get('priceOverride', p['price']),
                        'trademark': p['trademark'],
                        'path': variant['path']
                    })
                    
                    if len(result) == target:
                        random.shuffle(result)
                        return result
                    
        random.shuffle(result)
        return result
        
def create_displayed_products():
    categories: dict[str, str] = {
        "polo": "pólók",
        "pulover": "pulóverek",
        "kabat": "kabátok",
        "karora": "karórák",
        "nadrag": "nadrágok",
        "cipo": "cipők",
    }
    
    displayed = []
    
    for k,v in categories.items():
        filled = fill_list(5, k)
        
        displayed.append([v, k, filled])
        
    return displayed

ACCENTLESS: dict[str, str] = {
    'á': 'a',
    'ó': 'o',
    'ö': 'o',
    'ő': 'o',
    'ú': 'u',
    'ü': 'u',
    'ű': 'u',
    'é': 'e',
    'í': 'i'
}
def do_search(input: str, sort: str, categories: tuple[str, ...], colors: set[str]):
    # Remove accents from characters when the user inputted something
    for c, r in ACCENTLESS.items():
        input = input.replace(c, r)
        
    input = input.lower()
    found = []
    
    corresponding_image: bool = len(colors) == 1
    first_color = list(colors)[0]
    
    for p in PRODUCTS:
        # Not in the provided category, or doesn't have to required colors
        if p['type'] not in categories or not set([c['color'] for c in p['variants']]).intersection(colors):
            continue
        
        has_all: bool = True
        
        if input:
            for i in input.split(' '):
                if i not in p['keywords']:
                    has_all = False
                    break
            
        if has_all:
            if corresponding_image:
                variant = get_variant(p, first_color)

                if variant:
                    image = variant['path']
                else:
                    print('Failed to get variant for this color!', p['id'])
                    continue
            else:
                image = p['variants'][0]['path']
                
            found.append({
                "price": p['price'],
                "name": p['name'],
                "trademark": p['trademark'],
                "description": p['description'],
                "id": p['id'],
                "reviews": p['reviews'],
                "rating": p['rating'],
                "image": image,
            })
    
    # For reverse variants obviously turn on this flag
    reverse: bool = sort in {'za', 'tmza', 'pricel', 'reviewl'}
    key = lambda i: i['name']
    
    if 'tm' in sort:
        key = lambda i: i['trademark']
    elif 'price' in sort:
        key = lambda i: i['price']
    elif 'review' in sort:
        key = lambda i: i['rating']
        
    found.sort(key=key, reverse=reverse)
    return found

def get_variant(product, color):
    if not all((product, color)):
        return None
    
    return next((v for v in product['variants'] if v['color'] == color), None)

def encode_list(values: tuple[str, ...], vs: tuple[str, ...]) -> int:
    total = 0
    for v in vs:
        if v in values:
            total += 1 << values.index(v)
    
    return total
def decode_num(values: tuple[str, ...], vs: int) -> tuple[str, ...]:
    new_values = []
    for i in range(len(values)):
        if 1 << i & vs or vs == 0:
            new_values.append(values[i])
            
    return tuple(new_values)

def category_encode(values: tuple[str, ...]) -> int:
    return encode_list(CATEGORY_TABLE, values)
def category_decode(value: int) -> tuple[str, ...]:
    return decode_num(CATEGORY_TABLE, value)

def color_encode(values: tuple[str, ...]) -> int:
    return encode_list(COLOR_TABLE, values)
def color_decode(value: int) -> tuple[str, ...]:
    return decode_num(COLOR_TABLE, value)

def construct_starlist(stars: int):
        starlist: list[int] = []
        
        for i in range(2, 11, 2):
            if stars == i - 1:
                starlist.append(1)
            elif i <= stars:
                starlist.append(2)
            else:
                starlist.append(0)
                
        return starlist

COLORS = {
    "white": ("#ffffff", '#dadada', 'fehér'),
    "gray": ("#606060", "#454545", 'szürke'),
    "black": ("#1E1E1E", '#000000', 'fekete'),
    "red": ("#e32e2e", "#9e1010", 'piros'),
    "orange": ("#f79a2f", "#bf741e", 'narancssárga'),
    "yellow": ("#fcd742", "#c6a41c", 'sárga'),
    "green": ("#9cf14c", "#74c12d", 'zöld'),
    "lblue": ("#3cd6f5", "#229eb7", 'világos kék'),
    "blue": ("#3838e9", "#1717b0", 'kék'),
    "purple": ("#6924ca", "#3f0e83", 'lila'),
    "magenta": ("#db20b8", "#960e7d", 'bíbor'),
    "pink": ("#f078a2", "#b5436b", 'rózsaszín'),
    "beige": ("#e0b76b", "#ab8643", 'bézs'),
    "brown": ("#633e24", "#3d2311", 'barna')
}



TYPES = load_types()
PATHS = load_paths()
PRODUCTS = load_products()

CATEGORY_TABLE = tuple(TYPES.keys())
COLOR_TABLE = tuple(COLORS.keys())