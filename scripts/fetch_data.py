import urllib.request
import json
import os
import re
from datetime import datetime, timezone

URL = 'http://ktiwari.in/webTT/'

def main():
    print(f"Fetching {URL}...")
    try:
        req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching URL: {e}")
        exit(1)

    # T1. Harden extraction
    match = re.search(r'<script[^>]+id=["\']batch-data["\'][^>]*>(.*?)</script>', html, re.DOTALL)
    if not match:
        raise SystemExit("FATAL: batch-data script tag not found — site markup may have changed. Aborting without touching data.json.")
    
    json_data = match.group(1).strip()
    
    try:
        parsed = json.loads(json_data)
        print(f"Successfully parsed JSON! Programs: {len(parsed.get('programs', []))}, Batches: {len(parsed.get('batches', {}))}")
    except json.JSONDecodeError as e:
        raise SystemExit(f"FATAL: Failed to parse JSON: {e}")
        
    # T2. Validate schema
    required_top_keys = {'programs', 'index', 'batches'}
    missing = required_top_keys - set(parsed.keys())
    if missing:
        raise SystemExit(f"FATAL: parsed JSON missing expected keys: {missing}. Not overwriting data.json.")
        
    if not isinstance(parsed.get('batches'), dict) or len(parsed['batches']) == 0:
        raise SystemExit("FATAL: 'batches' is empty or not a dict. Not overwriting data.json.")
        
    sample_batch = next(iter(parsed['batches'].values()))
    required_batch_keys = {'days', 'periods', 'periodLabels', 'grid', 'subjects'}
    missing_batch = required_batch_keys - set(sample_batch.keys())
    if missing_batch:
        raise SystemExit(f"FATAL: batch object missing expected keys: {missing_batch}. Not overwriting data.json.")

    # T3. Change-detection
    ts_match = re.search(r'Updated\s+([\d-]+\s[\d:]+)', html)
    source_updated_at = ts_match.group(1) if ts_match else None
    
    parsed['_meta'] = {
        'sourceUpdatedAt': source_updated_at,
        'fetchedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    }
    
    target_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public')
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, 'data.json')
    
    # Check existing data to see if we can skip writing
    if os.path.exists(target_path):
        try:
            with open(target_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                
            existing_ts = existing_data.get('_meta', {}).get('sourceUpdatedAt')
            if existing_ts and source_updated_at and existing_ts == source_updated_at:
                print(f"No change since last fetch (Updated {source_updated_at}), skipping write.")
                return # exit 0
        except Exception:
            pass # ignore errors reading old file, just overwrite
    
    with open(target_path, 'w', encoding='utf-8') as f:
        json.dump(parsed, f, indent=2)
        
    print(f"Successfully updated {target_path}")

if __name__ == '__main__':
    main()
