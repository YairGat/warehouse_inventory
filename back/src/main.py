import os
from config import APP, DB

def main():
    instance_path = os.path.join(os.path.dirname(__file__), '..', 'instance')
    db_path = os.path.join(os.path.dirname(__file__), 'warehouse.db')
    if not os.path.exists(db_path):
        with APP.app_context():
            DB.create_all()
    APP.run(debug=True, port=5001)

if __name__ == '__main__':
    main()
