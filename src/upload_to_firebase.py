"""
Firebase Cloud Storage Upload Script

This script uploads all pre-generated JSON files in the `data/` directory
to the Firebase Cloud Storage bucket `kondate-navi.firebasestorage.app`
under the `data/` prefix.

Usage:
  python src/upload_to_firebase.py
"""

import os
import glob
import firebase_admin
from firebase_admin import credentials, initialize_app, storage

import sys

# Prevent Firebase app double initialization if imported
try:
    firebase_app = firebase_admin.get_app()
    print("Firebase Admin already initialized.")
except ValueError:
    try:
        # Use Application Default Credentials (ADC)
        cred = credentials.ApplicationDefault()
        firebase_app = initialize_app(cred, {
            'storageBucket': 'kondate-navi.firebasestorage.app'
        })
        print("Firebase Admin initialized successfully using ADC.")
    except Exception as e:
        print(f"Error initializing Firebase Admin: {e}")
        print("Ensure you have run `gcloud auth application-default login` or set GOOGLE_APPLICATION_CREDENTIALS.")
        exit(1)

def upload_json_to_firebase(file_path):
    """
    Uploads the specified JSON file to the `data/` folder in the bucket.
    """
    if not os.path.exists(file_path):
        print(f"File '{file_path}' not found. Exiting.")
        return

    bucket = storage.bucket()
    file_name = os.path.basename(file_path)
    target_blob_name = f"data/{file_name}"
    
    blob = bucket.blob(target_blob_name)
    
    print(f"Uploading {file_name} -> Firebase Storage ({target_blob_name}) ...", end=" ", flush=True)
    
    blob.upload_from_filename(
        file_path, 
        content_type='application/json'
    )
    
    # Set cache-control to no-store to let SWR architecture perform the check
    blob.cache_control = 'no-store, max-age=0'
    blob.patch()
    
    print("Done! (cache-control: no-store)")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python upload_to_firebase.py <path_to_json_file>")
        print("Example: python upload_to_firebase.py webapp/data/2026_3.json")
        exit(1)
        
    target_file = sys.argv[1]
    upload_json_to_firebase(target_file)
