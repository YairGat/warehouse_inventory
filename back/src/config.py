from flask import (
    Flask, request, jsonify, render_template,
    redirect, url_for, session, send_file
)
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from utils import format_hebrew_datetime

global APP
global DB

def init_app_and_db():
    APP = Flask(__name__, template_folder='templates', static_folder='static')
    CORS(APP, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])
    APP.secret_key = 'supersecret'
    APP.config['SESSION_PERMANENT'] = False  # default cookies die on close
    APP.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///warehouse.db'
    APP.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    APP.jinja_env.filters['hebrew_datetime'] = format_hebrew_datetime

    DB = SQLAlchemy(APP)


