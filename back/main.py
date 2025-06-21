# warehouse_app.py
#
# Flask inventory manager with role-based access control + session-based
# user tracking. The current logged-in user (in session['username'])
# is automatically stamped on every action—no “user” field is accepted
# from the client any more.
#
# Roles:
#   • viewer – read-only
#   • editor – may create / edit / delete warehouses and items
# --------------------------------------------------------------------

from flask import (
    Flask, request, jsonify, render_template,
    redirect, url_for, session, send_file
)
from flask_cors import CORS
from datetime import datetime
from uuid import uuid4
import os
import csv
from babel.dates import format_datetime
from functools import wraps

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
app.secret_key = 'supersecret'
app.config['SESSION_PERMANENT'] = False      # default cookies die on close


# --------------------------------------------------------------------
# In-memory data
# --------------------------------------------------------------------
warehouses = {
    "1": {
        "name": "קרביץ",
        "inventory": {
            "מברגה": {"quantity": 5, "user": "admin"},
            "פטיש": {"quantity": 2, "user": "admin"}
        }
    },
    "2": {
        "name": "קרביץ פלוגת יפתח",
        "inventory": {
            "מברגה": {"quantity": 3, "user": "admin"},
            "פלייר": {"quantity": 7, "user": "admin"}
        }
    },
    "3": {
        "name": "מחסן גדוד אלון",
        "inventory": {
            "מברגה": {"quantity": 1, "user": "admin"},
            "מסור": {"quantity": 4, "user": "admin"}
        }
    },
    "4": {
        "name": "מחסן גדוד ארז",
        "inventory": {
            "פטיש": {"quantity": 6, "user": "admin"},
            "פלייר": {"quantity": 2, "user": "admin"}
        }
    }
}

actions = []

users = {
    "admin": {"password": "adminadmin", "role": "editor"},
    "yael":  {"password": "1234",   "role": "viewer"},
}

# --------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------
def current_user():
    """Return the username from the session (or None if not logged in)."""
    return session.get("username")

def user_role():
    """Return the role of the current user (defaults to 'viewer')."""
    return session.get("role") or users.get(current_user(), {}).get("role", "viewer")

def editor_required(view):
    """Decorator: block non-editors from mutating data."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        if user_role() != "editor":
            if request.accept_mimetypes.accept_html:
                return "Permission denied — read-only account", 403
            return jsonify({"error": "permission denied"}), 403
        return view(*args, **kwargs)
    return wrapped

def format_hebrew_datetime(iso_str):
    dt = datetime.fromisoformat(iso_str)
    return format_datetime(dt, locale='he')

app.jinja_env.filters['hebrew_datetime'] = format_hebrew_datetime

def log_action(user, action_type, warehouse_id, item_name, quantity):
    actions.append({  # O(1) complexity
        "timestamp": datetime.now().isoformat(),  # Include seconds
        "user": user,
        "action": action_type,
        "warehouse_id": warehouse_id,
        "item": item_name,
        "quantity": quantity
    })

@app.route('/get_actions', methods=['GET'])
def get_actions():
    # Return actions in reverse order (latest first) without modifying the list
    return jsonify(list(reversed(actions))), 200

@app.route('/get_actions/<warehouse_id>', methods=['GET'])
def get_actions_for_warehouse(warehouse_id):
    filtered = [action for action in reversed(actions) if str(action.get('warehouse_id')) == str(warehouse_id)]
    return jsonify(filtered), 200

# --------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------
@app.route('/')
def home():
    if not current_user():
        return redirect(url_for('login'))
    return render_template(
        'index.html',
        warehouses=warehouses,
        users=users,
        role=user_role()
    )

# ----------  Warehouses --------------------------------------------
@app.route('/warehouses', methods=['POST'])
@editor_required
def create_warehouse():
    data = request.json or {}
    name = data.get('name')
    if not name:
        return jsonify({"error": "Missing warehouse name"}), 400

    # Find the next available numeric ID
    if warehouses:
        next_id = str(max(int(i) for i in warehouses.keys()) + 1)
    else:
        next_id = "1"
    warehouses[next_id] = {"name": name, "inventory": {}}
    return jsonify({"id": next_id, "name": name}), 201

@app.route('/warehouses', methods=['GET'])
def list_warehouses():
    return jsonify(warehouses)

@app.route('/warehouses/<warehouse_id>', methods=['GET'])
def get_warehouse(warehouse_id):
    wh = warehouses.get(warehouse_id)
    if not wh:
        return jsonify({"error": "Warehouse not found"}), 404
    return jsonify(wh)

# ----------  Items ---------------------------------------------------
@app.route('/warehouses/<warehouse_id>/items', methods=['POST'])
@editor_required
def add_item(warehouse_id):
    data     = request.json or {}
    item     = data.get('item')
    quantity = data.get('quantity')

    if item is None or quantity is None:
        return jsonify({"error": "Missing fields"}), 400
    try:
        quantity = int(quantity)
    except (ValueError, TypeError):
        return jsonify({"error": "Quantity must be an integer"}), 400

    wh = warehouses.get(warehouse_id)
    if not wh:
        return jsonify({"error": "Warehouse not found"}), 404

    inventory       = wh['inventory']
    prev_quantity   = inventory.get(item, {}).get("quantity", 0)
    inventory[item] = {"quantity": prev_quantity + quantity, "user": current_user()}
    log_action(current_user(), "פריט חדש", warehouse_id, item, quantity)
    return jsonify({"item": item, "quantity": inventory[item]["quantity"]})

@app.route('/warehouses/<warehouse_id>/items', methods=['PUT'])
@editor_required
def update_item(warehouse_id):
    data     = request.json or {}
    item     = data.get('item')
    quantity = data.get('quantity')

    if item is None or quantity is None:
        return jsonify({"error": "Missing fields"}), 400

    wh = warehouses.get(warehouse_id)
    if not wh:
        return jsonify({"error": "Warehouse not found"}), 404

    wh['inventory'][item] = {"quantity": quantity, "user": current_user()}
    log_action(current_user(), "עדכון פריט", warehouse_id, item, quantity)
    return jsonify({"item": item, "new_quantity": quantity})

@app.route('/warehouses/<warehouse_id>/items/<item>', methods=['DELETE'])
@editor_required
def remove_item(warehouse_id, item):
    wh = warehouses.get(warehouse_id)
    if not wh or item not in wh['inventory']:
        return jsonify({"error": "Item not found"}), 404

    quantity = wh['inventory'].pop(item)["quantity"]
    log_action(current_user(), "מחיקת פריט", warehouse_id, item, quantity)
    return jsonify({"removed_item": item, "quantity": quantity})

# ----------  History & Export ---------------------------------------
@app.route('/export_inventory')
def export_inventory():
    output_path = 'inventory_export.csv'
    with open(output_path, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['מחסן', 'פריט', 'כמות', 'משתמש אחרון'])
        for wh in warehouses.values():
            for item, data in wh['inventory'].items():
                writer.writerow([wh['name'], item, data['quantity'], data['user']])
    return send_file(output_path, as_attachment=True)

@app.route('/export_inventory/<warehouse_id>')
def export_inventory_single(warehouse_id):
    """Download a CSV for just one warehouse."""
    wh = warehouses.get(warehouse_id)
    if not wh:
        return "Warehouse not found", 404

    # file name: inventory_<ID>.csv  (quick & safe)
    output_path = f'inventory_{warehouse_id}.csv'
    with open(output_path, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['פריט', 'כמות', 'משתמש אחרון'])
        for item, data in wh['inventory'].items():
            writer.writerow([item, data['quantity'], data['user']])

    return send_file(output_path, as_attachment=True)

# ----------  Auth -----------------------------------------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or request.form
    username = data.get('username')
    password = data.get('password')

    user_rec = users.get(username)
    if user_rec and user_rec['password'] == password:
        session['username'] = username
        session['role']     = user_rec['role']
        session.permanent   = False           # ← key line
        return jsonify({"success": True}), 200
    else:
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# --------------------------------------------------------------------
# Launch
# --------------------------------------------------------------------
if __name__ == '__main__':
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static',    exist_ok=True)
    app.run(debug=True, port=5001)