from datetime import datetime

def format_datetime(dt: datetime) -> str:
    """
    Format a datetime object into a human-readable string.
    """
    if not dt:
        return ""
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def truncate_text(text: str, max_length: int = 100) -> str:
    """
    Truncates text to a specified length and appends ellipses.
    """
    if len(text) <= max_length:
        return text
    return text[:max_length] + "..."
