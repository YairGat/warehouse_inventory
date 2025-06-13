from flask import Flask, request, jsonify, render_template, redirect, url_for, session, send_file
from datetime import datetime
from uuid import uuid4
import os
import csv
from babel.dates import format_datetime

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = 'supersecret'

# In-memory data
warehouses = {}
actions = []
discrepancies = []

users = {
    "admin": {"password": "admin123", "role": "admin"},
    "yael": {"password": "1234", "role": "reporter"}
}

def current_user():
    return session.get("username")

def user_has_permission():
    user = current_user()
    return users.get(user, {}).get("role") == "admin"

def format_hebrew_datetime(iso_str):
    dt = datetime.fromisoformat(iso_str)
    return format_datetime(dt, locale='he')

app.jinja_env.filters['hebrew_datetime'] = format_hebrew_datetime

def log_action(user, action_type, warehouse_id, item_name, quantity):
    actions.append({
        "timestamp": datetime.now().isoformat(),
        "user": user,
        "action": action_type,
        "warehouse_id": warehouse_id,
        "item": item_name,
        "quantity": quantity
    })

@app.route('/')
def home():
    if not current_user():
        return redirect(url_for('login'))
    return render_template('index.html', warehouses=warehouses, users=users, user_has_permission=user_has_permission)

@app.route('/warehouses', methods=['POST'])
def create_warehouse():
    data = request.json
    warehouse_id = str(uuid4())
    warehouses[warehouse_id] = {
        "name": data['name'],
        "inventory": {}
    }
    return jsonify({"id": warehouse_id, "name": data['name']}), 201

@app.route('/warehouses/<warehouse_id>/items', methods=['POST'])
def add_item(warehouse_id):
    data = request.json
    user = data.get('user')
    item = data.get('item')
    quantity = data.get('quantity')

    if user is None or item is None or quantity is None:
        return jsonify({"error": "Missing fields"}), 400

    try:
        quantity = int(quantity)
    except (ValueError, TypeError):
        return jsonify({"error": "Quantity must be an integer"}), 400

    wh = warehouses.get(warehouse_id)
    if not wh:
        return jsonify({"error": "Warehouse not found"}), 404

    inventory = wh['inventory']
    prev_quantity = inventory.get(item, {}).get("quantity", 0)
    inventory[item] = {
        "quantity": prev_quantity + quantity,
        "user": user
    }
    log_action(user, "add", warehouse_id, item, quantity)
    return jsonify({"item": item, "quantity": inventory[item]["quantity"]})

@app.route('/warehouses/<warehouse_id>/items', methods=['PUT'])
def update_item(warehouse_id):
    data = request.json
    user = data['user']
    item = data['item']
    quantity = data['quantity']
    wh = warehouses.get(warehouse_id)
    if not wh:
        return jsonify({"error": "Warehouse not found"}), 404
    wh['inventory'][item] = {
        "quantity": quantity,
        "user": user
    }
    log_action(user, "update", warehouse_id, item, quantity)
    return jsonify({"item": item, "new_quantity": quantity})

@app.route('/warehouses/<warehouse_id>/items/<item>', methods=['DELETE'])
def remove_item(warehouse_id, item):
    user = request.args.get('user')
    wh = warehouses.get(warehouse_id)
    if not wh or item not in wh['inventory']:
        return jsonify({"error": "Item not found"}), 404
    quantity = wh['inventory'].pop(item)["quantity"]
    log_action(user, "remove", warehouse_id, item, quantity)
    return jsonify({"removed_item": item, "quantity": quantity})

@app.route('/warehouses', methods=['GET'])
def list_warehouses():
    return jsonify(warehouses)

@app.route('/warehouses/<warehouse_id>', methods=['GET'])
def get_warehouse(warehouse_id):
    wh = warehouses.get(warehouse_id)
    if not wh:
        return jsonify({"error": "Warehouse not found"}), 404
    return jsonify(wh)

@app.route('/discrepancies', methods=['GET', 'POST'])
def report_discrepancy():
    if request.method == 'POST':
        if not current_user() or users.get(current_user(), {}).get('role') != 'reporter':
            return redirect(url_for('home'))
        data = request.form
        discrepancies.append({
            "id": str(uuid4()),
            "item": data['item'],
            "expected": data['expected'],
            "actual": data['actual'],
            "warehouse": data['warehouse'],
            "reporter": current_user(),
            "status": "לא בוצע",
            "timestamp": datetime.now().isoformat()
        })
        return redirect(url_for('report_discrepancy'))

    status_filter = request.args.get('status')
    user_filter = request.args.get('reporter')
    filtered = discrepancies
    if status_filter:
        filtered = [d for d in filtered if d['status'] == status_filter]
    if user_filter:
        filtered = [d for d in filtered if d['reporter'] == user_filter]

    return render_template('discrepancies.html', discrepancies=filtered,
                           warehouses=warehouses, status_filter=status_filter,
                           user_filter=user_filter)

@app.route('/discrepancies/<id>/update', methods=['POST'])
def update_discrepancy_status(id):
    if not user_has_permission():
        return redirect(url_for('home'))
    new_status = request.form.get('status')
    for d in discrepancies:
        if d['id'] == id:
            d['status'] = new_status
            break
    return redirect(url_for('report_discrepancy'))

@app.route('/history')
def history():
    warehouse_id = request.args.get('warehouse_id')
    user_filter = request.args.get('user')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    query = request.args.get('q', '').lower()

    filtered_actions = actions
    if warehouse_id:
        filtered_actions = [a for a in filtered_actions if a['warehouse_id'] == warehouse_id]
    if user_filter:
        filtered_actions = [a for a in filtered_actions if a['user'] == user_filter]
    if start_date:
        filtered_actions = [a for a in filtered_actions if a['timestamp'] >= start_date]
    if end_date:
        filtered_actions = [a for a in filtered_actions if a['timestamp'] <= end_date]
    if query:
        filtered_actions = [a for a in filtered_actions if query in a['user'].lower()
                            or query in a['item'].lower() or query in a['action'].lower()]

    return render_template('history.html', actions=filtered_actions, warehouses=warehouses,
                           selected_warehouse_id=warehouse_id, selected_user=user_filter,
                           start_date=start_date, end_date=end_date, search_query=query)

@app.route('/export_inventory')
def export_inventory():
    output_path = 'inventory_export.csv'
    with open(output_path, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['מחסן', 'פריט', 'כמות', 'משתמש אחרון'])
        for wid, wh in warehouses.items():
            for item, data in wh['inventory'].items():
                writer.writerow([wh['name'], item, data['quantity'], data['user']])
    return send_file(output_path, as_attachment=True)

@app.route('/users', methods=['GET', 'POST'])
def manage_users():
    if not user_has_permission():
        return redirect(url_for('home'))
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role']
        users[username] = {"password": password, "role": role}
        return redirect(url_for('manage_users'))
    return render_template('users.html', users=users)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username in users and users[username]['password'] == password:
            session['username'] = username
            return redirect(url_for('home'))
        return "שגיאת התחברות", 401
    return '''
        <form method="post">
            שם משתמש: <input name="username"><br>
            סיסמה: <input name="password" type="password"><br>
            <button type="submit">התחבר</button>
        </form>
    '''

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == '__main__':
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    app.run(debug=True)
