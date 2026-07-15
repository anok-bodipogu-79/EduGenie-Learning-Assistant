import json
import re

def clean_json_response(raw_text: str):
    """
    Cleans markdown code block wraps (like ```json ... ``` or ``` ... ```)
    from LLM output and parses it into a Python data structure (list or dict).
    """
    cleaned = raw_text.strip()
    
                                           
    match = re.search(r'```(?:json)?\s*(.*?)\s*```', cleaned, re.DOTALL | re.IGNORECASE)
    if match:
        cleaned = match.group(1).strip()
    else:
                                                                              
        cleaned = re.sub(r'^```(?:json)?', '', cleaned)
        cleaned = re.sub(r'```$', '', cleaned)
        cleaned = cleaned.strip()
        
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
                                                                                        
        print(f"JSON Parsing Error: {e}. Attempting basic recovery.")
        try:
                                                             
            fixed_quotes = re.sub(r"'([^']*)'", r'"\1"', cleaned)
            return json.loads(fixed_quotes)
        except Exception:
                                                        
            raise e
