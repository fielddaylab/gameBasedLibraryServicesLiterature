#!/usr/bin/env python3
"""
Attach extracted chapter PDFs to bookSection records in Zotero using drag-and-drop-like approach.

This script reads the extracted chapter PDFs and creates symlinks or provides instructions
for manual attachment in Zotero.
"""

import os
import json
from pathlib import Path

# Mapping of chapter filenames to Zotero bookSection keys
CHAPTER_MAPPING = {
    "01-oxford_college_library.pdf": "C8NFR865",
    "02-here_you_can_play.pdf": "NM2D9FVK",
    "03-adding_flair.pdf": "4KZTEW3K",
    "04-level_up.pdf": "TRUKPXJZ",
    "05-taming_the_beast.pdf": "GCKCKG4A",
    "06-instructional_gaming.pdf": "A6MQ8Z87",
    "07-lessons_learned.pdf": "IV5PNS87",
    "08-plays_the_thing.pdf": "FVUJATAC",
    "09-trial_by_fire.pdf": "BSK9P6T6",
    "10-saving_world.pdf": "VBV7QIJU",
    "11-breaking_out.pdf": "H84FIJXH",
    "12-make_escape.pdf": "ZMTMS62A",
    "13-so_overt.pdf": "423TFW6Q",
    "14-where_go.pdf": "NS2QKV9Q",
    "15-out_of_class.pdf": "T444CKRT",
    "16-dewey_decimated.pdf": "ESH8A654",
    "17-old_building.pdf": "BRIGUBRH",
}

def main():
    print("=" * 80)
    print("Zotero Chapter Attachment Guide")
    print("=" * 80)
    print()
    
    chapters_dir = Path.home() / "Desktop" / "GBLS_Book_Chapters"
    
    if not chapters_dir.exists():
        print(f"✗ Chapter directory not found: {chapters_dir}")
        return 1
    
    # Verify all chapters exist
    print(f"Verifying extracted chapters in: {chapters_dir}\n")
    
    missing = []
    for filename in CHAPTER_MAPPING.keys():
        path = chapters_dir / filename
        if path.exists():
            size_mb = path.stat().st_size / (1024*1024)
            print(f"✓ {filename} ({size_mb:.1f}MB)")
        else:
            print(f"✗ {filename} - NOT FOUND")
            missing.append(filename)
    
    if missing:
        print(f"\n⚠ {len(missing)} chapters missing. Extract them first.")
        return 1
    
    print()
    print("=" * 80)
    print("MANUAL ATTACHMENT INSTRUCTIONS")
    print("=" * 80)
    print()
    print("Option 1: Drag and Drop in Zotero (Easiest)")
    print("-" * 80)
    print("1. In Zotero, open the first bookSection record (e.g., C8NFR865 - The Gaming Program)")
    print("2. In Finder, navigate to: ~/Desktop/GBLS_Book_Chapters/")
    print("3. Drag the corresponding PDF file onto the Zotero record (into the attachments pane)")
    print("4. The attachment will upload to Zotero and be linked to the record")
    print("5. Repeat for each of the 17 chapter PDFs")
    print()
    print("Option 2: Using Zotero's Add Attachment Dialog")
    print("-" * 80)
    print("1. In Zotero, open a bookSection record")
    print("2. Click the attachment icon or right-click and select 'Add Attachment' → 'Attach File'")
    print("3. Navigate to ~/Desktop/GBLS_Book_Chapters/ and select the matching PDF")
    print("4. Zotero will create the attachment and upload it")
    print()
    print("=" * 80)
    print("QUICK REFERENCE: Chapter → Zotero Key")
    print("=" * 80)
    print()
    
    for filename, zotero_key in CHAPTER_MAPPING.items():
        print(f"{filename:40s} → {zotero_key}")
    
    print()
    print("=" * 80)
    print("Notes:")
    print("=" * 80)
    print("• All chapter PDFs have been extracted from the main book")
    print("• Page numbers have been added to each bookSection record in Zotero")
    print("• Once attached, each chapter will be searchable as an individual item")
    print("• The original full book record (87ZB9FSP) remains unchanged")
    print()
    
    return 0


if __name__ == "__main__":
    exit(main())
