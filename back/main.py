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
    if not name:
        return jsonify({"error": "Missing warehouse name"}), 400
    
    if not groups:
        return jsonify({"error": "At least one group must be assigned"}), 400

    # Always assign the admin group
    if ADMIN not in groups:
        groups.append(ADMIN)

    # Find the next available numeric ID
    if warehouses:
        next_id = str(max(int(i) for i in warehouses.keys()) + 1)
    else:
        next_id = "1"
    warehouses[next_id] = {"name": name, "groups": groups, "inventory": {}}
    return jsonify({"id": next_id, "name": name, "groups": groups}), 201

@app.route('/warehouses/<warehouse_id>', methods=['DELETE'])
@admin_required
def delete_warehouse(warehouse_id):
    wh = warehouses.get(warehouse_id)
    if not wh or current_group() not in wh.get('groups', []):
        return jsonify({"error": "Warehouse not found"}), 404
    del warehouses[warehouse_id]
    log_action(current_user(), "מחיקת מחסן", warehouse_id, None, None)
    return jsonify({"success": True, "deleted_warehouse": warehouse_id}), 200


@app.route('/warehouses', methods=['GET'])
def list_warehouses():
    visible_warehouses = {
        wid: w for wid, w in warehouses.items()
        if current_group() in w.get('groups', [])
    }
    return jsonify(visible_warehouses), 200

@app.route('/warehouses/<warehouse_id>', methods=['GET'])
def get_warehouse(warehouse_id):
    wh = warehouses.get(warehouse_id)
    if not wh or current_group() not in wh["groups"]:
        return jsonify({"error": "Warehouse not found"}), 404
    return jsonify(wh)

# ----------  Items ---------------------------------------------------
@app.route('/warehouses/<warehouse_id>/items', methods=['POST'])
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
def remove_item(warehouse_id, item):
    wh = warehouses.get(warehouse_id)
    if not wh or item not in wh['inventory']:
        return jsonify({"error": "Item not found"}), 404

    quantity = wh['inventory'].pop(item)["quantity"]
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
    app.run(debug=True, port=5001)