# calculate_metrics.py

Calculates all corpus metrics for both the **GBLS corpus** (coded article summaries) and the **reference corpus** (journal article archive). Writes all output artifacts and refreshes both metrics explorer JavaScript bundles in a single run.

## Requirements

Python 3.10+ with pandas and openpyxl:

```bash
pip install pandas openpyxl
```

## Usage

Run from the project root:

```bash
python3 tools/calculate_metrics.py              # both corpora (default)
python3 tools/calculate_metrics.py --gbls       # GBLS corpus only
python3 tools/calculate_metrics.py --reference  # reference corpus only
```

Or from any directory using an absolute path:

```bash
python3 /path/to/tools/calculate_metrics.py
```

---

## GBLS corpus

Parses every coded article summary in `1_coded_gbls_corpus_articles/`, calculates reproducible metrics, and writes all artifacts to `2_calculated_metrics/gbls_corpus_metrics/`.

### What it does

1. **Reads the schema** — finds and parses the controlled lexicon in `0_human_sources/`. No field names are hardcoded.
2. **Discovers source files** — finds all `.md` files in `1_coded_gbls_corpus_articles/`, excluding `template.md` and hidden files.
3. **Parses each file** — extracts citation, metadata fields, summary text, and proposed contributions. Handles scalar fields (`Field: value`) and multi-label list fields (YAML list format).
4. **Detects multi-label fields at runtime** — a field is treated as multi-label if any article encodes it as a list.
5. **Calculates all metrics** — article-level derived fields, aggregate counts, co-occurrence, year breakdowns.
6. **Writes all output files** — CSVs, JSON, Excel workbook, JS bundle, validation report, manifest.
7. **Cleans up obsolete files** — removes metric files for fields no longer in the schema.

### Output files

All files except the JS bundle are written to `2_calculated_metrics/gbls_corpus_metrics/`.

#### Article tables

| File | Description |
|------|-------------|
| `articles.csv` | One row per article — all fields including full summary text |
| `articles_core.csv` | Same without `summary_text` |
| `article_features_long.csv` | One row per article-feature assignment; always `present=1` |
| `article_feature_matrix.csv` | Binary article × feature matrix across all feature groups |
| `contributions.csv` | One row per extracted proposed contribution |

#### Per-field tables (one pair per schema field)

| File | Description |
|------|-------------|
| `{field}_matrix.csv` | Binary article × value matrix for that field |
| `{field}_counts.csv` | Aggregate article counts and percentages per value |

#### Aggregate tables

| File | Description |
|------|-------------|
| `feature_counts.csv` | Counts for all feature groups in one table |
| `publication_year_counts.csv` | Article counts by publication year |
| `feature_year_counts.csv` | Feature counts broken down by publication year |
| `feature_cooccurrence.csv` | Pairs of features co-occurring in ≥2 articles, sorted by frequency |
| `dataset_summary.csv` | Headline corpus metrics (one row per metric) |
| `dataset_summary.json` | Same as above in JSON |

#### Support files

| File | Description |
|------|-------------|
| `data_dictionary.csv` | Documents every generated file — grain, purpose, primary key |
| `feature_datasets_readme.md` | Human-readable guide to loading the metric files in pandas |
| `gbls_feature_overview.xlsx` | Excel workbook — Dashboard, Year Counts, All Feature Counts, per-field sheets |
| `validation_report.json` | Parse counts, consistency checks, and any warnings |
| `generated_artifact_manifest.json` | List of all generated files with byte sizes and timestamp |

#### JavaScript explorer

| File | Description |
|------|-------------|
| `2_calculated_metrics/metrics_explorer_data.js` | Combined JS bundle for the metrics explorer — contains both `window.GBLS_METRICS` and `window.GBLS_REFERENCE_CORPUS` |

### Loading GBLS outputs in Python

```python
import pandas as pd

metrics_dir = "2_calculated_metrics/gbls_corpus_metrics"

articles = pd.read_csv(f"{metrics_dir}/articles_core.csv")
features = pd.read_csv(f"{metrics_dir}/article_features_long.csv")
matrix   = pd.read_csv(f"{metrics_dir}/article_feature_matrix.csv")
counts   = pd.read_csv(f"{metrics_dir}/feature_counts.csv")

# Filter to a single feature group
service_area_counts = counts[counts["feature_group"] == "service_area"]

# Articles with a specific service area
learning = features[features["feature_value"] == "learning_and_literacy"]["article_id"]
```

### Adding new GBLS source files

Drop new `.md` files into `1_coded_gbls_corpus_articles/` following the standard template and re-run the script. The file count is detected automatically.

---

## Reference corpus

Reads the coded journal article archive manifest, calculates metrics for the ~7,200 reference corpus articles (the grey articles in the metrics explorer), and writes all artifacts to `2_calculated_metrics/reference_corpus_metrics/`.

### Source data

The script reads `1_coded_reference_corpus_articles/_manifest.jsonl` — a JSONL file where each line is a structured record for one journal article.

Each manifest record contains:

| Manifest key | Schema field | Type |
|---|---|---|
| `evidence` | `Evidence_Type` | list |
| `method` | `Primary_Methodology` | scalar |
| `context` | `Library_Context` | scalar |
| `game` | `Game_Format` | scalar |
| `services` | `Service_Area` | list |
| `audience` | `Audience` | list |
| `outcomes` | `Intended_Outcome` | list |
| `confidence` | `Coding_Confidence` | scalar |
| `journal` | (extra) | scalar |
| `title` | (extra) | scalar |
| `doi` | (extra) | scalar |

`Source_Type` and `Peer_Review` are fixed as `peer_reviewed_journal_article` / `peer_reviewed` for every record. All coding is based on titles and abstracts only — not full-text review.

### Output files

All files except the JS bundle are written to `2_calculated_metrics/reference_corpus_metrics/`.

#### Article table

| File | Description |
|------|-------------|
| `articles.csv` | One row per article — all fields including journal, title, doi, coding_basis |
| `article_features_long.csv` | One row per article-feature assignment; always `present=1` |
| `article_feature_matrix.csv` | Binary article × feature matrix across all feature groups |

#### Per-field tables (one pair per schema field)

| File | Description |
|------|-------------|
| `{field}_matrix.csv` | Binary article × value matrix for that field |
| `{field}_counts.csv` | Aggregate article counts and percentages per value |

#### Aggregate tables

| File | Description |
|------|-------------|
| `feature_counts.csv` | Counts for all feature groups in one table |
| `journal_counts.csv` | Article counts per journal, sorted by frequency |
| `publication_year_counts.csv` | Article counts by publication year |
| `feature_year_counts.csv` | Feature counts broken down by publication year |
| `feature_cooccurrence.csv` | Feature pairs co-occurring in ≥2 articles, sorted by frequency |
| `dataset_summary.csv` | Headline corpus metrics (one row per metric) |
| `dataset_summary.json` | Same as above in JSON |

#### Support files

| File | Description |
|------|-------------|
| `data_dictionary.csv` | Documents every generated file |
| `readme.md` | Quick-start guide for loading files in pandas |
| `reference_corpus_overview.xlsx` | Excel workbook — Dashboard, Year Counts, Journal Counts, All Feature Counts, per-field sheets |
| `validation_report.json` | Record counts, consistency checks, and any issues |
| `generated_artifact_manifest.json` | All generated files with byte sizes and timestamp |

#### JavaScript explorer

Both corpora are written to the same combined file — see the GBLS corpus section above.

### Loading reference corpus outputs in Python

```python
import pandas as pd

metrics_dir = "2_calculated_metrics/reference_corpus_metrics"

articles  = pd.read_csv(f"{metrics_dir}/articles.csv")
features  = pd.read_csv(f"{metrics_dir}/article_features_long.csv")
matrix    = pd.read_csv(f"{metrics_dir}/article_feature_matrix.csv")
counts    = pd.read_csv(f"{metrics_dir}/feature_counts.csv")
journals  = pd.read_csv(f"{metrics_dir}/journal_counts.csv")

# Articles from a specific journal
ccq = articles[articles["journal"] == "Cataloging & Classification Quarterly"]

# Feature counts for service area
service = counts[counts["feature_group"] == "service_area"]
```

### Adding new reference articles

Add new lines to `1_coded_reference_corpus_articles/_manifest.jsonl` and re-run. The article count is detected automatically.

---

## Corpus comparison

| | GBLS corpus | Reference corpus |
|---|---|---|
| Source | `.md` files in `1_coded_gbls_corpus_articles/` | `_manifest.jsonl` in `1_coded_reference_corpus_articles/` |
| Articles | ~200 fully coded | ~7,200 abstract-only coded |
| Extra fields | summary text, contributions | journal, title, doi |
| JS variable | `window.GBLS_METRICS` | `window.GBLS_REFERENCE_CORPUS` |
| Explorer role | Coloured foreground articles | Grey background articles |

---

## Counting conventions

- A source contributes **at most one count** per feature value, regardless of how often a concept appears in prose.
- **Multi-label fields** (e.g., `Service_Area`, `Audience`) can contribute multiple assignments per article — one per coded value.
- `article_pct` = `article_count / total_articles × 100`
- `article_pct_in_year` uses the number of articles in that year as the denominator.
- Multi-label values in CSV tables are pipe-delimited: `learning_and_literacy|programming_and_facilitation`.

## Schema changes

The script reads the schema fresh on every run. To add, rename, or remove a controlled field:

1. Edit `0_human_sources/metadata-schema-and-lexicon.md`.
2. Update the relevant coded summaries or manifest records.
3. Re-run the script.

Files for removed fields are automatically deleted. Files for new fields are created fresh.

## Validation

After every run, `validation_report.json` in each output directory confirms:

- Every source file / manifest line produced exactly one article row.
- All `article_id` values are unique and non-blank.
- `article_features_long.present` contains only `1`.
- The matrix row count equals the article count.
- The sum of `feature_counts.article_count` equals total feature assignments in the long table.
- All generated CSV files can be loaded by pandas.
