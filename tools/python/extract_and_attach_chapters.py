#!/usr/bin/env python3
"""
Extract chapters from main book PDF and attach to bookSection records in Zotero.

This script:
1. Downloads the main book PDF (Games and Gamification in Academic Libraries)
2. Extracts each chapter as a separate PDF using page ranges
3. Uploads and attaches each chapter PDF to its corresponding bookSection record
"""

import json
import requests
import tempfile
import subprocess
import os
import sys
from pathlib import Path

# Configuration
config = json.load(open("project-config.json"))
ZOTERO_API_KEY = config["ZOTERO_API_KEY"]
ZOTERO_GROUP_ID = 5899078
MAIN_BOOK_KEY = "87ZB9FSP"  # Games and Gamification in Academic Libraries

# Chapter extraction ranges (ch_num, start_page, end_page, filename, zotero_key)
CHAPTERS = [
    (1, 3, 16, "01-oxford_college_library.pdf", "C8NFR865"),
    (2, 17, 30, "02-here_you_can_play.pdf", "NM2D9FVK"),
    (3, 31, 48, "03-adding_flair.pdf", "4KZTEW3K"),
    (4, 49, 64, "04-level_up.pdf", "TRUKPXJZ"),
    (5, 65, 82, "05-taming_the_beast.pdf", "GCKCKG4A"),
    (6, 83, 96, "06-instructional_gaming.pdf", "A6MQ8Z87"),
    (7, 97, 124, "07-lessons_learned.pdf", "IV5PNS87"),
    (8, 125, 140, "08-plays_the_thing.pdf", "FVUJATAC"),
    (9, 141, 156, "09-trial_by_fire.pdf", "BSK9P6T6"),
    (10, 157, 176, "10-saving_world.pdf", "VBV7QIJU"),
    (11, 177, 190, "11-breaking_out.pdf", "H84FIJXH"),
    (12, 191, 216, "12-make_escape.pdf", "ZMTMS62A"),
    (13, 217, 234, "13-so_overt.pdf", "423TFW6Q"),
    (14, 235, 250, "14-where_go.pdf", "NS2QKV9Q"),
    (15, 251, 264, "15-out_of_class.pdf", "T444CKRT"),
    (16, 265, 282, "16-dewey_decimated.pdf", "ESH8A654"),
    (17, 283, 558, "17-old_building.pdf", "BRIGUBRH"),
]

headers = {"Zotero-API-Key": ZOTERO_API_KEY, "Content-Type": "application/json"}
base_url = f"https://api.zotero.org/groups/{ZOTERO_GROUP_ID}/items"


def download_main_pdf():
    """Download main book PDF from Zotero."""
    print("Downloading main book PDF...")
    
    # Get children of main book to find PDF attachment
    url = f"{base_url}/{MAIN_BOOK_KEY}/children"
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"Failed to get book children: {response.status_code}")
    
    children = response.json()
    pdf_child = next(
        (c for c in children if "pdf" in c["data"].get("contentType", "").lower()),
        None
    )
    
    if not pdf_child:
        raise Exception("No PDF attachment found in main book")
    
    pdf_key = pdf_child["key"]
    pdf_title = pdf_child["data"].get("title", "PDF")
    
    # Download PDF
    url = f"{base_url}/{pdf_key}/file"
    response = requests.get(url, headers=headers, stream=True)
    
    if response.status_code != 200:
        raise Exception(f"Failed to download PDF: {response.status_code}")
    
    # Save to temp file
    with tempfile.NamedTemporaryFile(mode="wb", suffix=".pdf", delete=False) as tmp:
        for chunk in response.iter_content(chunk_size=8192):
            tmp.write(chunk)
        tmp_path = tmp.name
    
    file_size = os.path.getsize(tmp_path) / (1024 * 1024)
    print(f"✓ Downloaded {pdf_title} ({file_size:.1f}MB)")
    
    return tmp_path


def extract_chapter(main_pdf_path, start_page, end_page, output_path):
    """Extract a chapter from the main PDF using pdfseparate and pdfunite."""
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Extract individual pages
        temp_pattern = os.path.join(temp_dir, "page-%d.pdf")
        cmd = [
            "pdfseparate",
            "-f", str(start_page),
            "-l", str(end_page),
            main_pdf_path,
            temp_pattern
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            raise Exception(f"pdfseparate failed: {result.stderr}")
        
        # Merge extracted pages
        temp_files = sorted([
            os.path.join(temp_dir, f"page-{i}.pdf")
            for i in range(start_page, end_page + 1)
            if os.path.exists(os.path.join(temp_dir, f"page-{i}.pdf"))
        ])
        
        if not temp_files:
            raise Exception("No pages extracted")
        
        cmd = ["pdfunite"] + temp_files + [output_path]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            raise Exception(f"pdfunite failed: {result.stderr}")
        
        return True
    
    finally:
        # Clean up temp files
        subprocess.run(["rm", "-rf", temp_dir], capture_output=True)


def upload_and_attach_pdf(section_key, pdf_path, filename):
    """Upload PDF and attach to bookSection record via Zotero API."""
    
    # Get the bookSection item to get version info
    url = f"{base_url}/{section_key}"
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"Failed to get section item: {response.status_code}")
    
    section_item = response.json()
    
    # Create attachment child item
    attachment_data = {
        "itemType": "attachment",
        "parentItem": section_key,
        "linkMode": "imported_file",
        "title": filename,
        "accessDate": "",
        "url": "",
        "note": "",
        "tags": [],
        "contentType": "application/pdf",
        "charset": ""
    }
    
    # POST to create the attachment record
    url = f"{base_url}"
    response = requests.post(
        url,
        headers=headers,
        json=[attachment_data]
    )
    
    if response.status_code not in [200, 201]:
        raise Exception(f"Failed to create attachment record: {response.status_code}")
    
    result = response.json()
    
    if "success" not in result or not result["success"]:
        raise Exception(f"Attachment creation not successful: {result}")
    
    # Get the new attachment key
    attachment_key = list(result["success"].keys())[0] if result["success"] else None
    
    if not attachment_key:
        raise Exception("No attachment key returned")
    
    # Get upload authorization
    url = f"{base_url}/{attachment_key}/file"
    
    file_size = os.path.getsize(pdf_path)
    file_mtime = int(os.path.getmtime(pdf_path) * 1000)  # milliseconds
    
    auth_data = {
        "md5": "",
        "filename": filename,
        "filesize": file_size,
        "mtime": file_mtime
    }
    
    response = requests.post(url, headers=headers, json=auth_data)
    
    if response.status_code not in [200, 201]:
        raise Exception(f"Failed to get upload authorization: {response.status_code}")
    
    auth_result = response.json()
    
    if "url" not in auth_result:
        raise Exception(f"No upload URL in auth response: {auth_result}")
    
    # Upload file
    upload_url = auth_result["url"]
    
    with open(pdf_path, "rb") as f:
        files = {"file": f}
        response = requests.post(
            upload_url,
            files=files,
            data=auth_result.get("params", {})
        )
    
    if response.status_code not in [200, 201]:
        raise Exception(f"File upload failed: {response.status_code}")
    
    # Register upload
    url = f"{base_url}/{attachment_key}/file"
    
    register_data = {
        "upload": auth_result.get("uploadKey", "")
    }
    
    response = requests.post(url, headers=headers, json=register_data)
    
    if response.status_code not in [200, 201, 204]:
        raise Exception(f"Failed to register upload: {response.status_code}")
    
    return True


def main():
    print("=" * 60)
    print("Chapter Extraction and Attachment Tool")
    print("=" * 60)
    print()
    
    # Download main PDF
    try:
        main_pdf_path = download_main_pdf()
    except Exception as e:
        print(f"✗ Failed to download main PDF: {e}", file=sys.stderr)
        sys.exit(1)
    
    print()
    
    # Create temp directory for extracted chapters
    output_dir = tempfile.mkdtemp(prefix="gbls_chapters_")
    print(f"Extracting chapters to: {output_dir}\n")
    
    # Extract and attach each chapter
    successful = 0
    failed = 0
    
    for ch_num, start_page, end_page, filename, zotero_key in CHAPTERS:
        try:
            output_path = os.path.join(output_dir, filename)
            
            # Extract chapter
            print(f"Extracting chapter {ch_num} (pages {start_page}-{end_page})...", end=" ", flush=True)
            extract_chapter(main_pdf_path, start_page, end_page, output_path)
            file_size = os.path.getsize(output_path) / (1024 * 1024)
            print(f"({file_size:.1f}MB)")
            
            # Upload and attach
            print(f"  Uploading to Zotero ({zotero_key})...", end=" ", flush=True)
            upload_and_attach_pdf(zotero_key, output_path, filename)
            print("✓")
            
            successful += 1
            
        except Exception as e:
            print(f"✗ {e}", file=sys.stderr)
            failed += 1
            continue
    
    print()
    print("=" * 60)
    print(f"Results: {successful} successful, {failed} failed")
    print("=" * 60)
    
    # Clean up
    try:
        os.unlink(main_pdf_path)
        subprocess.run(["rm", "-rf", output_dir], capture_output=True)
    except:
        pass
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
