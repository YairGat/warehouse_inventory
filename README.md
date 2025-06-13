# 📦 Warehouse Inventory Management System

A lightweight and user-friendly web application for managing inventory across multiple warehouses, with user authentication, role-based access control, discrepancy reporting, and export to Excel.

---

## 🚀 Key Features

- ✅ Manage multiple warehouses and their inventories
- ✅ Log all actions (add, update, remove) with timestamp and username
- ✅ Two user roles:
  - `admin`: full access to inventory, discrepancies, and user management
  - `reporter`: can report inventory discrepancies only
- ✅ Discrepancy tracking with status (Completed / Pending / In Progress)
- ✅ Export full inventory to Excel (CSV)
- ✅ Right-to-left (RTL) interface for Hebrew support
- ✅ Responsive design (mobile-friendly)

---

## 📂 Project Structure

warehouse_inventory_app/
├── app.py
├── static/
│ └── bhd1_logo.SVG
├── templates/
│ ├── index.html
│ ├── login.html
│ ├── users.html
│ ├── discrepancies.html
│ └── history.html
└── README.md


---

## 🧪 Installation

Make sure you have Python 3.7 or higher. Then install the required libraries:

```bash
pip install flask babel


---

## 🧪 Installation

Make sure you have Python 3.7 or higher. Then install the required libraries:

```bash
pip install -r requrements.txt

## Running the pipe

python app.py

Then visit the following URL in your browser:

http://localhost:5000/
