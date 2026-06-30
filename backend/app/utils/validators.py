import re

def validate_email(email: str) -> bool:
    """
    Validate that an email address is syntactically correct.
    """
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email))

def validate_password_strength(password: str) -> bool:
    """
    Validate password is at least 6 characters.
    """
    return len(password) >= 6
