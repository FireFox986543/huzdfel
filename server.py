from flask import render_template, Flask, request, redirect, abort, url_for
import product_datas as p
import api
from datetime import datetime
from jinja2.exceptions import TemplateNotFound

SESSIONS: dict = {}

app: Flask = Flask(__name__)
api.initialize(app, SESSIONS)
p.initialize()


DISPLAYED_PRODUCTS = p.create_displayed_products()

print('HÚZDFEL.HU szerver indul!')
print(f'{len(p.PRODUCTS)} termék betöltve')

@app.before_request
def session_req():
    if request.remote_addr not in SESSIONS:
        SESSIONS[request.remote_addr] = {
            'cart': [],
            'ordered': None
        }

def get_session():
    return SESSIONS.get(request.remote_addr, None)

def get_cart_length():
    session = get_session()
    
    return len(session['cart']) if session else 0

def get_cart(session):
    items = []
    
    for item in session['cart']:
            product = p.get_product(item['id'])
            variant = p.get_variant(product, item['color'])
            
            if not all((product, variant)):
                print('Failed to get product/variant form cart: ' + item)
                continue
            
            items.append({
                'id': item['id'],
                'color': p.COLORS[item['color']][2],
                'size': item['size'],
                'quantity': int(item['quantity']),
                'price': product['price'], # type: ignore
                'name': product['name'], # type: ignore
                'trademark': product['trademark'], # type: ignore
                'image': variant['path'] # type: ignore
            })
            
    return items

@app.route('/')
def index():
    return render_template('index.html', display_products=DISPLAYED_PRODUCTS)

@app.route('/termek')
def termek():
    product_id = request.args.get('v', None)
    product = p.get_product(product_id)
    type_info = p.get_type_info(product_id)
    
    if not all((product_id, type_info, product)):
        abort(404)
    
    return render_template('termek.html', product=product, type_info=type_info, stars=p.construct_starlist(product.get('rating', 0))) # type: ignore

@app.route('/kereses')
def kereses():
    try:
        input: str = request.args.get('q', '').strip()
        cat: tuple[str, ...] = p.category_decode(int(request.args.get('c', 0)))
        cat_view: bool = bool(request.args.get('v', False))     
        cols: set = set(p.color_decode(int(request.args.get('s', 0))))
        sort: str = request.args.get('o', 'az')
        is_embed: bool = bool(request.args.get('embed', False))
        
        if (not cat_view and not is_embed and input == '') or (cat_view and not is_embed and request.args.get('c', 0) == 0) or (is_embed and not (input or request.args.get('c', 0) != 0)):
            return redirect('/')
    except ValueError:
        abort(400)
    except Exception:
        abort(500)
        
    results = p.do_search(input, sort, cat, cols)
    category_list = [(k, v['path'][1]) for k, v in p.TYPES.items()]
    
    if is_embed:
        return render_template('i_kereses.html', results=results, get_stars=lambda product: p.construct_starlist(product.get('rating', 0)), q=input)
    
    if cat_view and len(cat) > 0:
        cat_name = p.TYPES[cat[0]]['path'][1]
    else:
        cat_name = None
    
    return render_template('kereses.html', q=input, category_list=category_list, colors=p.COLORS, cat_view=cat_view, cat_name=cat_name)

@app.route('/kosar')
def kosar():
    session = SESSIONS.get(request.remote_addr)
    items = []
    
    if session:
        items = get_cart(session)
    
    return render_template('kosar.html', cart=items)

@app.route('/fizetes')
def fizetes():
    session = get_session()
    
    if not session or len(session['cart']) < 1:
        return redirect('/kosar')
    
    return render_template('fizetes.html')

@app.route('/megrendeles')
def megrendeles():
    session = get_session()
    utanvet = bool(request.args.get('u', False))
    
    if not session or len(session['cart']) < 1:
        return redirect('/kosar')
    
    items = get_cart(session)
    return render_template('megrendeles.html', items=items, price=sum([x['price'] * x['quantity'] for x in items]), utanvet=utanvet)

@app.route('/rendeles_siker')
def sikeres_rendeles():
    session = get_session()
    
    if not session or not session['ordered'] or (datetime.now() - session['ordered']).total_seconds() > 5 * 60:
        return redirect('/kosar')
    
    return render_template('rendeles_siker.html')

@app.route('/bejelentkezes')
def bejelentkezes():
    return render_template('bejelentkezes.html')

@app.route('/regisztracio')
def regisztracio():
    return render_template('regisztracio.html')

@app.route('/docs/<path>')
def documents(path):
    try:
        return render_template('doc_' + path + '.html')
    except TemplateNotFound:
        abort(404)
        
@app.errorhandler(404)
def page404(_):
    return render_template('not_found.html'), 404

app.jinja_env.globals['menu_paths'] = p.PATHS
app.jinja_env.globals['get_icon'] = lambda t, u: url_for('static', filename=f'img/termek_{t}/{u}.webp')
app.jinja_env.globals['format_number'] = lambda n: f'{n:_}'.replace('_', ' ')
app.jinja_env.globals['convert_cat'] = lambda c: p.category_encode((c,))
app.jinja_env.globals['get_cart_items'] = get_cart_length
app.jinja_env.globals['titlename'] = 'HúzdFel.HU'
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000, debug=True)