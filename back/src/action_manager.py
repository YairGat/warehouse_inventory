from flask import (
    Flask, request, jsonify, render_template,
    redirect, url_for, session, send_file
)
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import csv
from babel.dates import format_datetime
from datetime import datetime

from user_manager import admin_required, current_user, current_group, get_group_by_password
from utils import format_hebrew_datetime
from db_classes import Warehouse, InventoryItem, warehouses
from consts import ADMIN, GROUPS

ACTIONS = []

def log_action(user, action_type, warehouse_id, item_name, quantity):
    ACTIONS.append({  # O(1) complexity
        "timestamp": datetime.now().isoformat(),  # Include seconds
        "user": user,
        "action": action_type,
        "warehouse_id": warehouse_id,
        "item": item_name,
        "quantity": quantity
    })
