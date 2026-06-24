#!/usr/bin/env python3
"""
Extract chapters from main book PDF.

This script downloads the main book PDF and extracts each chapter as a separate PDF.
You can then manually attach these to the bookSection records in Zotero.
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

headers = {"Zotero-API-Key": ZOTERO_API_KEY}
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
        # Use a more efficient approach: extract directly using pdftk if available,
        # otherwise fall back to pdfseparate/pdfunite
        try:
            # Try pdftk first (faster)
            cmd = ["pdftk", main_pdf_path, "cat", f"{start_page}-{end_page}", "output", output_path]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                return True
        except FileNotFoundError:
            pass
        
        # Fall back to pdfseparate/pdfunite
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


def main():
    print("=" * 70)
    print("Chapter Extraction Tool")
    print("=" * 70)
    print()
    
    # Create output directory
    output_dir = os.path.expanduser("~/Desktop/GBLS_Book_Chapters")
    os.makedirs(output_dir, exist_ok=True)
    print(f"Output directory: {output_dir}\n")
    
    # Download main PDF
    try:
        main_pdf_path = download_main_pdf()
    except Exception as e:
        print(f"✗ Failed to download main PDF: {e}", file=sys.stderr)
        sys.exit(1)
    
    print()
    
    # Extract each chapter
    successful = 0
    failed = 0
    
    for ch_num, start_page, end_page, filename, zotero_key in CHAPTERS:
        try:
            output_path = os.path.join(output_dir, filename)
            
            pages_count = end_page - start_page + 1
            print(f"Extracting chapter {ch_num:2d} (pages {start_page:3d}-{end_page:3d}, {pages_count:3d} pages)...", 
                  end=" ", flush=True)
            
            extract_chapter(main_pdf_path, start_page, end_page, output_path)
            
            file_size = os.path.getsize(output_path) / (1024 * 1024)
            print(f"✓ ({file_size:.1f}MB) [{zotero_key}]")
            
            successful += 1
            
        except Exception as e:
            print(f"✗ {e}", file=sys.stderr)
            failed += 1
            continue
    
    print()
    print("=" * 70)
    print(f"Results: {successful} extracted, {failed} failed")
    print("=" * 70)
    print()
    
    if successful > 0:
        print(f"Next steps:")
        print(f"1. Go to: {output_dir}")
        print(f"2. Open each PDF file to verify it contains the correct chapter")
        print(f"3. In Zotero, open each bookSection record")
        print(f"4. Drag and drop the corresponding PDF file into the record")
        print()
        print(f"Zotero keys for reference:")
        for ch_num, start_page, end_page, filename, zotero_key in CHAPTERS:
            print(f"  {filename} -> {zotero_key}")
    
    # Clean up
    try:
        os.unlink(main_pdf_path)
    except:
        pass
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
