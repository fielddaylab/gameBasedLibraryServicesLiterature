# Prompt: Summarize One GBLS Article from Unfiled Zotero Queue

Self-contained, single-article workflow for Games-Based Library Services (GBLS) literature summary and classification. This prompt processes one randomly-selected unfiled article per execution. Do not rely on prior context.

## CONFIGURATION

ZOTERO_GROUP_ID: 5899078
ZOTERO_LIBRARY: "IMLS Games and Libraries"
PROJECT_ROOT: /Users/djgagnon/development/gameBasedLibraryServicesLiterature
SUMMARY_FOLDER: ${PROJECT_ROOT}/1_coded_gbls_corpus_articles
HUMAN_SOURCES_FOLDER: ${PROJECT_ROOT}/0_human_sources
METADATA_SCHEMA_FILE: ${HUMAN_SOURCES_FOLDER}/metadata-schema-and-lexicon.md
BASELINE_FILE: ${HUMAN_SOURCES_FOLDER}/current_manuscript.md

COLLECTION_COMPLETE_NAME: "Summary Complete"
TOOL_SCRIPT: ${PROJECT_ROOT}/tools/fetch_unfiled.py

PROTECTED_DIRECTORIES: ${HUMAN_SOURCES_FOLDER} (read-only; no modifications)

## OBJECTIVE

1. Execute `${TOOL_SCRIPT}` to fetch all unfiled articles with PDF attachments from `${ZOTERO_GROUP_ID}`.
2. Select one article at random from the results.
3. Retrieve the article's PDF from Zotero.
4. Read the article carefully and classify it using `${METADATA_SCHEMA_FILE}` controlled vocabulary.
5. Write a single standalone summary markdown file in `${SUMMARY_FOLDER}` following the naming convention.
6. File the article in Zotero under "Summary Complete" collection and any section-specific collections that match its contributions.
7. Commit all changes with a single git commit at the end of the run.

## FILENAME CONVENTION

Pattern: `{author_lastname}{year}({zotero_item_key}).md`

Example: `baker2024(R55LL85J).md`

Rules:
- Normalize author's last name to lowercase ASCII; remove spaces, punctuation, apostrophes, hyphens.
- Use only the first author's last name. For organizational authors, use a concise filesystem-safe name.
- Use publication year or "nd" if unavailable.
- Preserve parentheses around the Zotero key and the `.md` extension.
- Do not overwrite an existing file. If a filename collision occurs with a different article, stop and investigate.

## WORKFLOW

### Step 1: Fetch Unfiled Articles
Execute: `python3 ${TOOL_SCRIPT}`

This returns a JSON array of all unfiled articles with PDF children. Count the remaining unfiled articles and report the total.

### Step 2: Select One Article at Random
From the JSON results, select one article at random. Extract:
- `SOURCE_ZOTERO_ITEM_KEY`: the item's `key` field
- `SOURCE_AUTHOR_LASTNAME`: normalized first author's last name (lowercase, no spaces/punctuation)
- `SOURCE_YEAR`: publication year from `data.date` or "nd" if unavailable
- `SOURCE_APA_CITATION`: full APA citation constructed from Zotero metadata

Before proceeding, verify that no summary file already exists in `${SUMMARY_FOLDER}` matching this article's Zotero key.

### Step 3: Retrieve and Read the PDF
Locate the PDF in the article's Zotero children. Extract the PDF content using `pdftotext` or equivalent PDF parser. Read the entire article carefully, noting:
- Purpose, scope, and central arguments
- Methods and evidence type
- Participant context (library type, audience, setting)
- Game formats discussed
- Library services or outcomes described
- Limitations and cautions in the evidence

### Step 4: Classify Using Metadata Schema
Using `${METADATA_SCHEMA_FILE}` as your only source of controlled values, assign:
- `Source_Type`: one controlled value (e.g., peer_reviewed_journal_article, book, case_study, etc.)
- `Peer_Review`: controlled value from the schema
- `Evidence_Type`: controlled value matching the research approach
- `Primary_Methodology`: controlled value for the research method
- `Library_Context`: controlled value for the setting
- `Game_Format`: one or more controlled values
- `Service_Area`: one or more controlled values describing the library service
- `Audience`: controlled value if applicable
- `Intended_Outcome`: controlled value if applicable
- `Coding_Confidence`: high, medium, or low (your assessment of classification certainty)

**Important**: Use ONLY values present in `${METADATA_SCHEMA_FILE}`. Do not invent new values. If no perfect match exists, select the closest defensible value and note the mismatch in the summary.

### Step 5: Write Summary File
Create filename: `${SOURCE_AUTHOR_LASTNAME}${SOURCE_YEAR}(${SOURCE_ZOTERO_ITEM_KEY}).md`

Write the summary in the article's own language and voice, approximately 500–800 words covering:
- What the article argues or reports
- Evidence, methods, and findings
- Relevance to games-based library services
- Any productive incongruences with the baseline review structure or metadata schema

Use this structure:

```
# ${SOURCE_APA_CITATION}

## Metadata
Citation_Key: [key]
Year: [year]
Zotero_Item_Key: [key]
Source_Type: [value]
Peer_Review: [value]
Evidence_Type: [value]
Primary_Methodology: [value]
Library_Context: [value]
Game_Format: [value or list]
Service_Area: [value or list]
Audience: [value]
Intended_Outcome: [value]
Coding_Confidence: [confidence]

## Summary
[Prose summary in the article's own language, covering purpose, arguments, evidence, and relevance.]

## Productive Incongruences and Challenges
[Description of any mismatch with metadata schema, baseline structure, or review scope. Or state: "No substantial incongruence identified."]

## Suggested Review Contributions
[List contributions by Target_Section matching exact headings from ${BASELINE_FILE}. Include Contribution_Text with concise, review-ready prose. Or state: "No review contribution warranted."]
```

### Step 6: File in Zotero
After the summary file is written and verified:

1. Add the article to the "Summary Complete" collection in Zotero.
2. For each suggested review contribution, identify the corresponding collection in Zotero that matches the baseline structure section. Add the article to all applicable collections.
3. Preserve all existing collection memberships.

### Step 7: Commit
Stage only the new summary file. Commit with message:
```
Add ${SOURCE_AUTHOR_LASTNAME}${SOURCE_YEAR} GBLS summary
```

Do not commit multiple articles in one commit. Do not modify or commit any files in `${HUMAN_SOURCES_FOLDER}`.

## READING AND CLASSIFICATION GUIDANCE

**Do not invent or distort.** Read the article's own claims, methods, and evidence. Classify based on what the article actually does, not what you wish it did. Use `medium` or `low` confidence for uncertain classifications.

**Best-guess metadata.** Use `${METADATA_SCHEMA_FILE}` as your guide. When an article does not fit perfectly, select the closest defensible value and document any mismatch in the "Productive Incongruences" section.

**Writing the summary:** Use the article's own voice and language to describe its arguments and evidence. Write approximately 500–800 words covering purpose, findings, and relevance to games-based library services. Distinguish:
- What the article claims or reports
- What the article actually found or measured
- Your synthesis for the GBLS project

When interpreting the article's relevance to GBLS, signal that shift explicitly: "For the larger GBLS project..." or "Read in relation to GBLS...".

**Identifying contributions.** Review the exact section headings in `${BASELINE_FILE}`. Match contributions to the most specific applicable section. Synthesize rather than quote the summary. If no section fits, propose a new section and explain why.

**Productive incongruences.** Describe any meaningful misalignment between the article and the metadata schema, baseline structure, or review scope. Examples:
- The article cannot be represented adequately by existing controlled values.
- The article supplies evidence that complicates a project assumption.
- The article addresses a gap in the baseline structure.

If no incongruence exists, state: "No substantial incongruence identified."

## PROTECTED DIRECTORIES

**Do not modify `${HUMAN_SOURCES_FOLDER}`.** This directory contains the authoritative metadata schema, baseline structure, and values framework. Read these files to inform your work; do not edit them.

## QUALITY VERIFICATION BEFORE COMMIT

Before committing:
- The summary file exists in `${SUMMARY_FOLDER}` with the correct naming pattern.
- The metadata uses only controlled values from `${METADATA_SCHEMA_FILE}`.
- The APA citation is complete and accurate (verify against the PDF title page if uncertain).
- No existing summary file for this article appears elsewhere in `${SUMMARY_FOLDER}`.
- Zotero collections have been updated to include "Summary Complete" and any section-specific collections.
- Git status shows only the new summary file staged.
- The commit message follows the format: "Add [AUTHOR][YEAR] GBLS summary"

## FINAL REPORT

Report:
- Article processed (author, year, Zotero key)
- Summary file created with full path
- Collections assigned in Zotero
- Commit hash
- Remaining unfiled count (from the original tool output)

If the workflow encounters a blocking issue (e.g., PDF cannot be extracted, Zotero is locked, collection name cannot be found), stop, document the specific blocker, and report it without making partial changes.
