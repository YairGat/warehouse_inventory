from consts import ADMIN
from config import DB

class Warehouse(DB.Model):
    id = DB.Column(DB.Integer, primary_key=True)
    name = DB.Column(DB.String(120), nullable=False)
    groups = DB.Column(DB.String(256), nullable=False)  # Comma-separated group names

    inventory_items = DB.relationship('InventoryItem', backref='warehouse', lazy=True)

class InventoryItem(DB.Model):
    id = DB.Column(DB.Integer, primary_key=True)
    warehouse_id = DB.Column(DB.Integer, DB.ForeignKey('warehouse.id'), nullable=False)
    name = DB.Column(DB.String(120), nullable=False)
    quantity = DB.Column(DB.Integer, nullable=False)
    user = DB.Column(DB.String(120), nullable=False)

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