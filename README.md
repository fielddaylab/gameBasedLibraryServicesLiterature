# Games-Based Library Services Literature Review

This repository contains the research materials, coded source summaries, prompt
library, and reproducible synthesis workflow for a literature review of
**Games-Based Library Services (GBLS)**.

GBLS is used here as an umbrella term for the ways libraries employ games,
play, gameful design, collections, technologies, spaces, professional
expertise, and partnerships to advance library purposes. The project examines
public, school, academic, and special-library work involving analog and digital
games, tabletop role-playing games, esports, escape rooms, immersive
technologies, game creation, collections, cataloging, instruction, outreach,
community formation, cultural stewardship, and research support.

## Project Goals

The project is designed to:

- synthesize a dispersed, interdisciplinary literature into a field-level
  account of GBLS;
- distinguish empirical evidence from practitioner experience, theoretical
  argument, and historical precedent;
- identify areas of agreement, disagreement, and uncertainty;
- document recurring service models, implementation conditions, and evidence
  gaps;
- support a literature review manuscript and related national needs-assessment
  research; and
- make the review process inspectable, repeatable, and maintainable as new
  sources are added.

The intended product is not an article-by-article annotated bibliography.
Sources are synthesized around library purposes, service models, design
conditions, outcomes, tensions, and research needs.

## Research Approach

The workflow combines conventional scholarly review, practitioner and
collaborator input, structured human coding, and carefully bounded uses of
large language models.

Human researchers remain responsible for source selection, the coding
framework, interpretive commitments, manuscript structure, citation
verification, revision, and final claims. LLMs are used as intermediate
analytic tools for tasks such as source summarization, metadata coding,
cross-source comparison, draft synthesis, and editorial review.

Generated text is not treated as evidence. The coded source summaries are the
evidence base for automated synthesis, while the files in `0-human-sources`
define the authors' structure, values, terminology, and evaluation criteria.

## Repository Structure

```text
.
├── 0-human-sources/
│   ├── current_manuscript.md
│   ├── explicit_values.md
│   ├── metadata-schema-and-lexicon.md
│   └── publishability_rubric.md
├── 1-coded-summaries/
│   ├── template.md
│   └── one Markdown file per source
├── 2-outputs/
│   ├── FIRST_DRAFT.md
│   ├── SECOND_DRAFT.md
│   ├── THIRD_DRAFT.md
│   ├── FINAL_DRAFT.md
│   ├── audits_and_synthetic_reviews/
│   └── metrics/
├── metrics-explorer/
│   ├── index.html
│   ├── metrics-explorer.css
│   ├── metrics-explorer.js
│   └── README.md
├── prompt-library/
│   ├── master_process_sources_into_review.md
│   ├── discover-gbls-literature.md
│   ├── summarize-from-zotero
│   ├── calculate_metrics.md
│   └── section-prompts/
│       ├── 00_shared_section_contract.md
│       ├── 01_runtime_section_writer.md
│       ├── 02_assemble_and_transition.md
│       └── 03_review_and_revision.md
└── todos
```

### `0-human-sources`

Authoritative, human-maintained inputs:

- **`current_manuscript.md`** defines the live manuscript hierarchy,
  section word targets, drafting instructions, and author-supplied prose. The
  synthesis process discovers the section structure from this file at run
  time.
- **`explicit_values.md`** states the project's interpretive commitments,
  including the treatment of games as cultural media, intentional access, and
  the need for sustainable service infrastructure. These values guide
  interpretation but are not empirical evidence.
- **`metadata-schema-and-lexicon.md`** defines the coded-summary fields and
  controlled vocabulary used across the corpus.
- **`publishability_rubric.md`** provides internal editorial criteria and
  journal-alignment checks for manuscript review.

These files should be changed deliberately and reviewed by the research team.
The synthesis workflow does not modify them.

### `1-coded-summaries`

This directory contains one structured Markdown record per source. Each record
typically includes:

- a full citation and stable Zotero identifiers;
- source and evidence types;
- methodology and library context;
- game formats, service areas, audiences, outcomes, and themes;
- contribution and design-principle coding;
- a substantive source summary;
- evidence limitations; and
- possible contributions to the review.

`template.md` defines the expected structure and is excluded from corpus
counts. Summary filenames follow the pattern:

```text
firstauthorYYYY(ZOTERO_ITEM_KEY).md
```

The summaries are analytical records, not substitutes for consulting the
original publications when a claim or citation requires verification.

### `2-outputs`

All generated manuscripts, audits, metrics, and review artifacts are written
here. This directory is excluded by `.gitignore`, so local runs do not add
large or rapidly changing generated files to version control.

The manuscript workflow produces four stages:

- `FIRST_DRAFT.md`: literal assembly of independently synthesized sections;
- `SECOND_DRAFT.md`: whole-manuscript integration and transition pass;
- `THIRD_DRAFT.md`: revision after the first publishability review; and
- `FINAL_DRAFT.md`: revision after the second independent review.

The `audits_and_synthetic_reviews` directory contains:

- a runtime structure manifest;
- a baseline-prose disposition audit;
- a complete corpus-coverage audit;
- a bidirectional citation audit; and
- reviewer notes for both synthetic review rounds.

Because outputs are not committed, collaborators should generate them locally
or exchange specific review drafts through the team's document-sharing
process.

### `prompt-library`

The prompt library contains reusable workflow specifications rather than
topic-specific manuscript sections.

#### `master_process_sources_into_review.md`

The master literature-review workflow. It:

1. resolves the project root;
2. inventories the current coded corpus;
3. asks before clearing generated outputs;
4. discovers all manuscript sections and nested headings from the live
   baseline;
5. synthesizes each runtime section from the coded summaries;
6. builds references and audits;
7. assembles and integrates the manuscript;
8. conducts two rubric-based review rounds; and
9. verifies headings, word targets, corpus coverage, and citation integrity.

The master prompt is self-contained and is intended to work in a fresh agent
session without relying on conversation history.

#### `section-prompts`

- **`00_shared_section_contract.md`** defines the authority hierarchy,
  evidence standards, heading rules, baseline-prose handling, citation rules,
  and ledger requirements shared by every section task.
- **`01_runtime_section_writer.md`** writes one section discovered from the
  current baseline. It supports narrative, front-matter, and reference modes.
- **`02_assemble_and_transition.md`** combines runtime sections in baseline
  order and performs a whole-manuscript integration pass.
- **`03_review_and_revision.md`** conducts two independent publishability
  reviews and produces the third and final drafts.

No static list of manuscript sections is encoded in these prompts. Changes to
the baseline hierarchy are picked up during the next run.

#### `discover-gbls-literature.md`

A self-contained discovery and acquisition workflow for finding credible GBLS
publications that are not already in the configured Zotero group library. It:

- derives scope and search priorities from the live human-source files;
- searches Google Scholar with complementary GBLS query families;
- checks the complete Zotero inventory and coded-summary corpus for duplicates;
- screens candidates at title-and-abstract level;
- obtains lawful full text through open-access sources or authorized
  UW-Madison Libraries access;
- imports verified parent records and PDF attachments into Zotero;
- files new parent items in the `Incoming` collection; and
- writes a discovery report to
  `2-outputs/audits_and_synthetic_reviews/google_scholar_discovery_report.md`.

The configured run limits screening to 40 candidates and imports at most 15
new items per run. The workflow does not create coded summaries, modify the
manuscript, or place items in `GPT Summary Complete`.

Run the prompt in an agent session with the Browser and Zotero capabilities
available. Keep Zotero open and be prepared to complete Google Scholar CAPTCHA
checks or UW-Madison authentication in the visible browser. The agent must
pause for these human-only steps and must not request, read, or store
credentials. Review the prompt's `Run Configuration` before using it with
another Zotero library, institution, or filesystem layout.

#### `summarize-from-zotero`

A batch workflow for adding new sources from the local Zotero group library.
It reads eligible source attachments, creates one coded Markdown summary per
source, files completed or excluded items into configured Zotero collections,
and optionally commits each completed record.

This prompt depends on a local Zotero installation, local API access, the
configured group library and collections, and valid local filesystem paths.
Review its `RUN CONFIGURATION` before using it on another computer or Zotero
library.

#### `calculate_metrics.md`

Runs `tools/calculate_metrics.py` to build all corpus metrics for both the
GBLS corpus (coded article summaries) and the reference corpus (journal
article archive). Writes CSVs, Excel workbooks, and the JavaScript bundles
consumed by the metrics explorer.

### `metrics-explorer`

A dependency-free browser interface for examining the generated corpus
metrics. After running the metrics prompt, open
`metrics-explorer/index.html`. If local browser security blocks the generated
data file, serve the repository locally:

```bash
python3 -m http.server 8765
```

Then open `http://localhost:8765/metrics-explorer/`.

## Typical Workflow

### 1. Discover and acquire sources

Run:

```text
prompt-library/discover-gbls-literature.md
```

The workflow reads the live project scope, searches Google Scholar, removes
known duplicates, screens candidates, and attempts lawful full-text
acquisition. It imports successful items into the configured Zotero group
library and files their parent records in `Incoming`.

Review the generated discovery report and inspect each imported Zotero record
for relevance, metadata quality, attachment readability, possible version
conflicts, and unresolved `Maybe`, `Possible duplicate`, or `PDF pending`
decisions. Discovery is preliminary screening, not final inclusion in the
review.

### 2. Add and code sources

After reviewing the items in `Incoming`, run:

```text
prompt-library/summarize-from-zotero
```

Review each generated record in `1-coded-summaries` for citation accuracy,
coding consistency, evidentiary limits, and fidelity to the source.

### 3. Revise the human framework

Update the files in `0-human-sources` as the research team's understanding
develops. In particular:

- revise `current_manuscript.md` to change manuscript organization
  or author-supplied arguments;
- revise the metadata schema when sources expose missing or ambiguous coding
  categories;
- revise `explicit_values.md` when interpretive commitments need clarification;
  and
- revise the rubric when target venues or editorial priorities change.

### 4. Rebuild corpus metrics

Run:

```bash
python3 tools/calculate_metrics.py
```

Inspect the generated validation artifacts before interpreting aggregate
patterns.

### 5. Generate the literature review

Run:

```text
prompt-library/master_process_sources_into_review.md
```

The workflow will inventory the live inputs and ask for approval before
clearing `2-outputs`. It then generates the staged manuscripts and audits.

### 6. Conduct human review

The final generated draft is a research-team working document, not a
publication-ready authority. Before submission:

- verify consequential claims against original sources;
- resolve every citation flagged by the audit;
- review exclusions and uncited sources;
- examine overrepresented library settings and evidence types;
- confirm that recommendations do not exceed their supporting evidence;
- review the methods account for accuracy; and
- adapt length, style, and formatting to the selected journal.

## Evidence Standards

The review gives greatest weight to empirical studies, experiments, surveys,
interviews, observations, systematic reviews, and meta-analyses. Local case
studies and practitioner reports are important for implementation knowledge
but are not treated as equivalent evidence of general outcomes. Historical
sources establish origins and continuity rather than contemporary
effectiveness.

Recurring claims are not automatically strong claims. The workflow explicitly
tracks:

- evidence type and methodology;
- library and audience context;
- null and mixed findings;
- adjacent evidence not conducted in libraries;
- practitioner recommendations with limited evaluation;
- baseline claims that require support; and
- unresolved or ambiguous bibliographic records.

## Reproducibility And Limitations

This repository makes the analytical process inspectable, but it does not make
the review fully automatic. Results remain sensitive to:

- the scope and completeness of the Zotero library;
- the accuracy of individual summaries and metadata;
- publication and language exclusions;
- uneven evidence across library types and game formats;
- prompt and model behavior;
- author decisions embedded in the baseline and explicit values; and
- human judgment during verification and revision.

The corpus and manuscript structure are expected to evolve. Aggregate counts,
draft word counts, and source totals should therefore be generated from the
current files rather than copied from prior runs.

## Contributing

For substantive changes:

1. add or revise one source summary per file;
2. preserve stable Zotero identifiers and the summary schema;
3. explain proposed schema or vocabulary changes;
4. keep generated files out of version control;
5. do not overwrite human-authored baseline prose without review; and
6. include the evidence limitations of any new source.

Before opening a pull request, check that Markdown files render correctly and
that prompt paths remain relative to the project root wherever possible.

## Citation And License

A formal project citation and repository license have not yet been specified.
Until they are added, contact the project team before redistributing the corpus
or reusing substantial project materials. Copyright in the reviewed
publications remains with their respective rights holders; the summaries are
research notes and do not replace the original works.
