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
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from uuid import uuid4
import csv
from babel.dates import format_datetime
from functools import wraps
import os

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app, supports_credentials=True, origins=["https://warehouse-inventory-l1nb.onrender.com"])
app.secret_key = 'supersecret'
app.config['SESSION_PERMANENT'] = False      # default cookies die on close
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///warehouse.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --------------------------------------------------------------------
# In-memory data
# --------------------------------------------------------------------
ADMIN = "admin"

# Define groups and which users belong to them
GROUPS = {
    ADMIN: "adminadmin",
    "סהר": "sahar123",
    "יפתח": "yiftah123"
}

# Example: assign warehouses to groups (list of group names)
warehouses = {
    "1": {
        "name": "קרביץ משרדים",
        "groups": [ADMIN, "סהר", "יפתח"],
        "inventory": {
            "מברגה": {"quantity": 5, "user": "orielbaz"},
            "פטיש": {"quantity": 2, "user": "orielbaz"}
        }
    },
    "2": {
        "name": "רספייה פלוגת יפתח",
        "groups": [ADMIN, "יפתח"],
        "inventory": {
            "מברגה": {"quantity": 3, "user": "orielbaz"},
            "פלייר": {"quantity": 7, "user": "orielbaz"}
        }
    },
    "3": {
        "name": "רספייה פלוגת סהר",
        "groups": [ADMIN, "סהר"],
        "inventory": {
            "מברגה": {"quantity": 1, "user": "orielbaz"},
            "מסור": {"quantity": 4, "user": "orielbaz"}
        }
    }
}

actions = []

class Warehouse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    groups = db.Column(db.String(256), nullable=False)  # Comma-separated group names

    inventory_items = db.relationship('InventoryItem', backref='warehouse', lazy=True)

class InventoryItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouse.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    user = db.Column(db.String(120), nullable=False)

def current_user():
    """Return the username from the session (or None if not logged in)."""
    return session.get("username")

def current_group():
    """Return the group of the current user from the session."""
    return session.get("group")

def get_group_by_password(password):
    """Return the group name by password, or None if not found."""
    for group, pwd in GROUPS.items():
        if pwd == password:
            return group
    return None

def admin_required(view):
    """Decorator: block non-editors from mutating data."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        if current_group() != ADMIN:
            if request.accept_mimetypes.accept_html:
                return "Permission denied — admins only", 403
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

# ----------  Warehouses --------------------------------------------
@app.route('/groups', methods=['GET'])
def get_groups():
    """Return all available groups as a list."""
    return jsonify([g for g in GROUPS.keys() if g != ADMIN]), 200

@app.route('/warehouses', methods=['POST'])
@admin_required
def create_warehouse():
    data = request.json or {}
    name = data.get('name')
    groups = data.get('groups', [])
    if not name or not groups:
        return jsonify({"error": "Missing fields"}), 400
    if ADMIN not in groups:
        groups.append(ADMIN)
    warehouse = Warehouse(name=name, groups=','.join(groups))
    db.session.add(warehouse)
    db.session.commit()
    return jsonify({"id": warehouse.id, "name": warehouse.name, "groups": groups}), 201

@app.route('/warehouses/<warehouse_id>', methods=['DELETE'])
@admin_required
def delete_warehouse(warehouse_id):
    warehouse = Warehouse.query.get(warehouse_id)
    if not warehouse or current_group() not in warehouse.groups.split(','):
        return jsonify({"error": "Warehouse not found"}), 404
    # Delete all inventory items for this warehouse
    InventoryItem.query.filter_by(warehouse_id=warehouse.id).delete()
    db.session.delete(warehouse)
    db.session.commit()
    log_action(current_user(), "מחיקת מחסן", warehouse_id, None, None)
    return jsonify({"success": True, "deleted_warehouse": warehouse_id}), 200

@app.route('/warehouses', methods=['GET'])
def list_warehouses():
    user_group = current_group()
    warehouses = Warehouse.query.all()
    if not warehouses:
        return jsonify({}), 200  # No warehouses available

    visible = {
        str(w.id): {
            "name": w.name,
            "groups": w.groups.split(','),
            "inventory": {
                item.name: {"quantity": item.quantity, "user": item.user}
                for item in w.inventory_items
            }
        }
        for w in warehouses if user_group in w.groups.split(',')
    }
    return jsonify(visible), 200

@app.route('/warehouses/<warehouse_id>', methods=['GET'])
def get_warehouse(warehouse_id):
    warehouse = Warehouse.query.get(warehouse_id)
    if not warehouse or current_group() not in warehouse.groups.split(','):
        return jsonify({"error": "Warehouse not found"}), 404
    wh = {
        "name": warehouse.name,
        "groups": warehouse.groups.split(','),
        "inventory": {
            item.name: {"quantity": item.quantity, "user": item.user}
            for item in warehouse.inventory_items
        }
    }
    return jsonify(wh)

# ----------  Items ---------------------------------------------------
@app.route('/warehouses/<int:warehouse_id>/items', methods=['POST'])
def add_item(warehouse_id):
    data = request.json or {}
    item = data.get('item')
    quantity = data.get('quantity')
    if item is None or quantity is None:
        return jsonify({"error": "Missing fields"}), 400
    warehouse = Warehouse.query.get(warehouse_id)
    if not warehouse:
        return jsonify({"error": "Warehouse not found"}), 404
    inv_item = InventoryItem.query.filter_by(warehouse_id=warehouse_id, name=item).first()
    if inv_item:
        inv_item.quantity += int(quantity)
        inv_item.user = current_user()
    else:
        inv_item = InventoryItem(
            warehouse_id=warehouse_id,
            name=item,
            quantity=int(quantity),
            user=current_user()
        )
        db.session.add(inv_item)
    db.session.commit()
    return jsonify({"item": item, "quantity": inv_item.quantity})

@app.route('/warehouses/<int:warehouse_id>/items', methods=['PUT'])
def update_item(warehouse_id):
    data = request.json or {}
    item = data.get('item')
    quantity = data.get('quantity')

    if item is None or quantity is None:
        return jsonify({"error": "Missing fields"}), 400

    warehouse = Warehouse.query.get(warehouse_id)
    if not warehouse:
        return jsonify({"error": "Warehouse not found"}), 404

    inv_item = InventoryItem.query.filter_by(warehouse_id=warehouse_id, name=item).first()
    if inv_item:
        inv_item.quantity = int(quantity)
        inv_item.user = current_user()
    else:
        inv_item = InventoryItem(
            warehouse_id=warehouse_id,
            name=item,
            quantity=int(quantity),
            user=current_user()
        )
        db.session.add(inv_item)
    db.session.commit()
    log_action(current_user(), "עדכון פריט", warehouse_id, item, quantity)
    return jsonify({"item": item, "new_quantity": quantity})

@app.route('/warehouses/<int:warehouse_id>/items/<item>', methods=['DELETE'])
def remove_item(warehouse_id, item):
    inv_item = InventoryItem.query.filter_by(warehouse_id=warehouse_id, name=item).first()
    if not inv_item:
        return jsonify({"error": "Item not found"}), 404

    quantity = inv_item.quantity
    db.session.delete(inv_item)
    db.session.commit()
    log_action(current_user(), "מחיקת פריט", warehouse_id, item, quantity)
    return jsonify({"removed_item": item, "quantity": quantity})

# ----------  History & Export ---------------------------------------
@app.route('/export_inventory', methods=['GET'])
def export_inventory():
    output_path = 'inventory_export.csv'
    with open(output_path, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['מחסן', 'פריט', 'כמות', 'משתמש אחרון'])
        for wh in warehouses.values():
            for item, data in wh['inventory'].items():
                writer.writerow([wh['name'], item, data['quantity'], data['user']])
    return send_file(output_path, as_attachment=True)

@app.route('/export_inventory/<warehouse_id>', methods=['GET'])
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
    # Find all groups this user belongs to
    group = get_group_by_password(password)
    # Example password check (replace with your logic)
    if group and username:
        session.permanent = False
        session['username'] = username
        session['group'] = group
        return jsonify({"success": True, "username": username, "group": group}), 200
    else:
        return jsonify({"success": False, "error": "Invalid credentials"}), 401
    

@app.route('/login', methods=['GET'])
def get_login_status():
    username = session.get('username')
    group = session.get('group')
    if username and group:
        return jsonify({"username": username, "group": group}), 200
    else:
        return jsonify({"username": None, "group": None}), 200

@app.route('/logout')
def logout():
    session.clear()
    return jsonify({"success": True}), 200

# --------------------------------------------------------------------
# Launch
# --------------------------------------------------------------------
if __name__ == '__main__':
    # Ensure the instance folder exists and DB is initialized
    instance_path = os.path.join(os.path.dirname(__file__), '..', 'instance')
    db_path = os.path.join(os.path.dirname(__file__), 'warehouse.db')
    if not os.path.exists(db_path):
        with app.app_context():
            db.create_all()
    app.run(debug=False, port=5000)