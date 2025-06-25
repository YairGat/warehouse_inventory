import os
from app import app, db

def main():
    instance_path = os.path.join(os.path.dirname(__file__), '..', 'instance')
    db_path = os.path.join(os.path.dirname(__file__), 'warehouse.db')
    if not os.path.exists(db_path):
        with app.app_context():
            db.create_all()
    app.run(debug=True, port=5001)

if __name__ == '__main__':
    main()
