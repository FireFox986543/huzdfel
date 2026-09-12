from flask import Flask, request, abort
import json
import os
import product_datas as p
from datetime import datetime
import requests

ORDERS_PATH = os.path.join(os.getcwd(), 'database/orders.json')

def initialize(app: Flask, SESSIONS: dict):
    def get_session():
        return SESSIONS.get(request.remote_addr, None)
    
    @app.route('/api/tables')
    def tables():
        return json.dumps({
            'category': p.CATEGORY_TABLE,
            'color': p.COLOR_TABLE
        }, ensure_ascii=False), 200
        
    @app.route('/api/clear_cart')
    def clear_cart():
        session = get_session()
        
        if not session:
            abort(400)
        
        session['cart'] = []
        return '', 200
    
    @app.route('/api/add', methods=['POST'])
    def add_to_cart():
        if not request.is_json:
            return 'Not correct format!', 400
        
        session = get_session()
        
        if not session:
            abort(500)
        
        data = request.get_json()
        id = data.get('id', None)
        color = data.get('color', None)
        size = data.get('size', '')
        quantity = data.get('quantity', None)
        
        if not all((id, color, quantity)):
            return 'Not all parameters provided!', 400
        
        try:
            quantity = int(quantity)
        except:
            return "Parameters don't meet required format!", 400
        
        session['cart'].append({
            'id': id,
            'color': color,
            'size': size,
            'quantity': quantity
        })
        return '', 200
    
    @app.route('/api/remove')
    def remove_from_cart():
        try:
            index = int(request.args.get('v', ''))
        except:
            abort(400)
        
        if index == None or index < 0:
            return 'Not all parameters are defined!', 400
        
        session = get_session()
        
        if not session or len(session['cart']) <= index:
            abort(500)
            
        session['cart'].pop(index)
        return '', 200
    
    @app.route('/api/change', methods=['POST'])
    def change_cart_item():
        try:
            data = request.get_json()
            index = int(data.get('index', None))
            quantity = int(data.get('quantity', 7))

            if quantity < 1:
                quantity = 1
            elif quantity > 20:
                quantity = 20
        except:
            return "Parameters don't meet required format!", 400
        
        if index == None or index < 0:
            return 'Not all parameters are defined!', 400
        
        session = get_session()
        
        if not session or len(session['cart']) <= index:
            return 'Given index is not within the bounds of the cart', 400
            
        session['cart'][index]['quantity'] = quantity
        print(session)
        return '', 200
    
    @app.route('/api/place', methods=['POST'])
    def place_order():
        session = get_session()
        
        if not session or len(session['cart']) < 1:
            return 'Cannot place order, as there\'s nothing in your cart!', 400

        try:
            data = request.get_json()
            name = data.get('name', None)
            email = data.get('email', None)
            phone = data.get('phone', None)
            zip = data.get('zip', None)
            place = data.get('place', None)
            street = data.get('street', None)
            utanvet = bool(data.get('utanvet', False))
            
            card = data.get('card', None)
            cardexp = data.get('cardexp', None)
            cardcvc = data.get('cardcvc', None)
            cardname = data.get('cardname', None)
            
            if not all((name, email, phone, zip, place, street)) or (not utanvet and not all((card, cardexp, cardcvc, cardname))):
                raise ValueError
        except:
            return 'Not all parameters are in the correct format', 400
        
        orders = None
        with open(ORDERS_PATH, 'r', encoding='utf-8') as f:
            orders = json.load(f)
        
        if not orders:
            orders = []
            
        with open(ORDERS_PATH, 'w', encoding='utf-8') as f:
            current_order = {
                'ip': request.remote_addr,
                'name': name,
                'email': email,
                'phone': phone,
                'zip': zip,
                'place': place,
                'street': street,
                'utanvet': utanvet,
                'items': session['cart']
            }
            
            if not utanvet:
                current_order['card'] = card
                current_order['cardExp'] = cardexp
                current_order['cardCVC'] = cardcvc
                current_order['cardName'] = cardname
            
            orders.append(current_order)
            json.dump(orders, f, indent=2, ensure_ascii=False)
        
        session['cart'] = []
        session['ordered'] = datetime.now()
        return '', 200
    
    @app.route('/api/zip')
    def get_zip():
        try:
            zip = int(request.args.get('v', 0))
            
            if zip < 1000:
                return 'Incomplete request!', 400
        except:
            return 'NaN', 400
        
        response = requests.get(f'https://net.posta.hu/zipcodefinder/public/zipcodefinder-api/rest/zipcode/telepulesKereso?zip={zip}')
        
        return response.text, response.status_code