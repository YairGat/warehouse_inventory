
def log_action(user, action_type, warehouse_id, item_name, quantity):
    actions.append({  # O(1) complexity
        "timestamp": datetime.now().isoformat(),  # Include seconds
        "user": user,
        "action": action_type,
        "warehouse_id": warehouse_id,
        "item": item_name,
        "quantity": quantity
    })
