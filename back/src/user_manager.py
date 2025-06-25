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

from consts import ADMIN, GROUPS

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
