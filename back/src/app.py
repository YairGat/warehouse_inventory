from flask import (
    Flask, request, jsonify, render_template,
    redirect, url_for, session, send_file
)
import csv
from babel.dates import format_datetime

from user_manager import admin_required, current_user, current_group, get_group_by_password
from action_manager import log_action, ACTIONS
from db_classes import Warehouse, InventoryItem, warehouses
from consts import ADMIN, GROUPS

from config import APP, DB


@APP.route('/get_actions', methods=['GET'])
def get_actions():
    # Return actions in reverse order (latest first) without modifying the list
    return jsonify(list(reversed(ACTIONS))), 200


@APP.route('/get_actions/<warehouse_id>', methods=['GET'])
def get_actions_for_warehouse(warehouse_id):
    filtered = [action for action in reversed(ACTIONS) if str(action.get('warehouse_id')) == str(warehouse_id)]
    return jsonify(filtered), 200


# ----------  Warehouses --------------------------------------------
@APP.route('/groups', methods=['GET'])
def get_groups():
    """Return all available groups as a list."""
    return jsonify([g for g in GROUPS.keys() if g != ADMIN]), 200


@APP.route('/warehouses', methods=['POST'])
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
    DB.session.add(warehouse)
    DB.session.commit()
    return jsonify({"id": warehouse.id, "name": warehouse.name, "groups": groups}), 201


@APP.route('/warehouses/<warehouse_id>', methods=['DELETE'])
@admin_required
def delete_warehouse(warehouse_id):
    warehouse = Warehouse.query.get(warehouse_id)
    if not warehouse or current_group() not in warehouse.groups.split(','):
        return jsonify({"error": "Warehouse not found"}), 404
    # Delete all inventory items for this warehouse
    InventoryItem.query.filter_by(warehouse_id=warehouse.id).delete()
    DB.session.delete(warehouse)
    DB.session.commit()
    log_action(current_user(), "מחיקת מחסן", warehouse_id, None, None)
    return jsonify({"success": True, "deleted_warehouse": warehouse_id}), 200


@APP.route('/warehouses', methods=['GET'])
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


@APP.route('/warehouses/<warehouse_id>', methods=['GET'])
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
@APP.route('/warehouses/<int:warehouse_id>/items', methods=['POST'])
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
        DB.session.add(inv_item)
    DB.session.commit()
    return jsonify({"item": item, "quantity": inv_item.quantity})


@APP.route('/warehouses/<int:warehouse_id>/items', methods=['PUT'])
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
        DB.session.add(inv_item)
    DB.session.commit()
    log_action(current_user(), "עדכון פריט", warehouse_id, item, quantity)
    return jsonify({"item": item, "new_quantity": quantity})


@APP.route('/warehouses/<int:warehouse_id>/items/<item>', methods=['DELETE'])
def remove_item(warehouse_id, item):
    inv_item = InventoryItem.query.filter_by(warehouse_id=warehouse_id, name=item).first()
    if not inv_item:
        return jsonify({"error": "Item not found"}), 404

    quantity = inv_item.quantity
    DB.session.delete(inv_item)
    DB.session.commit()
    log_action(current_user(), "מחיקת פריט", warehouse_id, item, quantity)
    return jsonify({"removed_item": item, "quantity": quantity})


# ----------  History & Export ---------------------------------------
@APP.route('/export_inventory', methods=['GET'])
def export_inventory():
    output_path = 'inventory_export.csv'
    with open(output_path, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['מחסן', 'פריט', 'כמות', 'משתמש אחרון'])
        for wh in warehouses.values():
            for item, data in wh['inventory'].items():
                writer.writerow([wh['name'], item, data['quantity'], data['user']])
    return send_file(output_path, as_attachment=True)


@APP.route('/export_inventory/<warehouse_id>', methods=['GET'])
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
@APP.route('/login', methods=['POST'])
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


@APP.route('/login', methods=['GET'])
def get_login_status():
    username = session.get('username')
    group = session.get('group')
    if username and group:
        return jsonify({"username": username, "group": group}), 200
    else:
        return jsonify({"username": None, "group": None}), 200


@APP.route('/logout')
def logout():
    session.clear()
    return jsonify({"success": True}), 200
