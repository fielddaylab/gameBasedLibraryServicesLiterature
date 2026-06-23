#!/usr/bin/env python3
"""
Fetch unfiled articles from a Zotero group library.
Reads credentials from project-config.json in the project root.
Temporary JSON files are written to /tmp and cleaned up automatically.
"""

import os
import sys
import json
import requests
import tempfile
import atexit

def has_pdf_children(item: dict) -> bool:
    """
    Check if an item has child items (which likely include PDF attachments).
    """
    num_children = item.get('meta', {}).get('numChildren', 0)
    return num_children > 0


def is_attachment_item(item: dict) -> bool:
    """
    Check if the item is itself an attachment (not a parent article).
    We only want parent items (articles, books, etc) not attachment items.
    """
    item_type = item.get('data', {}).get('itemType', '')
    return item_type == 'attachment'


def fetch_unfiled_articles(group_id: int) -> list:
    """
    Fetch all items from a Zotero group and return only unfiled items with PDF attachments.
    Unfiled items are those where the 'collections' array is empty and have a PDF attachment.
    """
    # Load config from project-config.json
    config_path = os.path.join(os.path.dirname(__file__), '..', 'project-config.json')
    
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        print(json.dumps({"error": f"Config file not found at {config_path}"}), file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON in project-config.json"}), file=sys.stderr)
        sys.exit(1)
    
    user_id = config.get('ZOTERO_USER_ID')
    api_key = config.get('ZOTERO_API_KEY')
    
    if not user_id or not api_key:
        print(json.dumps({"error": "Missing ZOTERO_USER_ID or ZOTERO_API_KEY in project-config.json"}), file=sys.stderr)
        sys.exit(1)
    
    headers = {
        'Zotero-API-Key': api_key,
        'Zotero-API-Version': '3'
    }
    
    base_url = f'https://api.zotero.org/groups/{group_id}/items'
    unfiled_items = []
    start = 0
    limit = 100
    
    while True:
        params = {
            'start': start,
            'limit': limit,
            'format': 'json'
        }
        
        try:
            response = requests.get(base_url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(json.dumps({"error": f"API request failed: {str(e)}"}), file=sys.stderr)
            sys.exit(1)
        
        items = response.json()
        
        if not items:
            break
        
        for item in items:
            # Skip attachment items (we only want parent articles/books/etc)
            if is_attachment_item(item):
                continue
            
            # Check if collections array is empty (indicating unfiled)
            collections = item.get('data', {}).get('collections', [])
            # Check if item has children (which typically include PDF attachments)
            if not collections and has_pdf_children(item):
                unfiled_items.append(item)
        
        # Check if we've fetched all items
        total_results = int(response.headers.get('Total-Results', 0))
        if start + limit >= total_results:
            break
        
        start += limit
    
    return unfiled_items

# Global list to track temp files for cleanup
_temp_files = []

def _cleanup_temp_files():
    """Clean up temporary files on exit."""
    for temp_file in _temp_files:
        try:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        except Exception:
            pass  # Silently ignore cleanup errors

# Register cleanup on exit
atexit.register(_cleanup_temp_files)

def main():
    group_id = 5899078
    unfiled = fetch_unfiled_articles(group_id)
    
    # Write temporary intermediate files to /tmp (for debugging/inspection if needed)
    temp_dir = tempfile.gettempdir()
    temp_unfiled = os.path.join(temp_dir, f'unfiled_items.json')
    temp_unfiled_pdf = os.path.join(temp_dir, f'unfiled_items_with_pdf.json')
    
    try:
        with open(temp_unfiled, 'w') as f:
            json.dump(unfiled, f, indent=2)
        _temp_files.append(temp_unfiled)
        
        with open(temp_unfiled_pdf, 'w') as f:
            json.dump(unfiled, f, indent=2)
        _temp_files.append(temp_unfiled_pdf)
    except Exception:
        pass  # If temp file writing fails, continue anyway
    
    # Output pure JSON to stdout for workflow consumption
    print(json.dumps(unfiled, indent=2))

if __name__ == '__main__':
    main()
