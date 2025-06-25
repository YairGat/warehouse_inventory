from datetime import datetime
from babel.dates import format_datetime

def format_hebrew_datetime(iso_str):
    dt = datetime.fromisoformat(iso_str)
    return format_datetime(dt, locale='he')