# GBLS Feature Datasets

Generated: 2026-06-18 00:23
Articles: 201 | Feature assignments: 2286

## Quick start (Python / Colab)

```python
import pandas as pd

metrics_dir = "2_calculated_metrics/gbls_corpus_metrics"
articles = pd.read_csv(f"{metrics_dir}/articles_core.csv")
features = pd.read_csv(f"{metrics_dir}/article_features_long.csv")
matrix   = pd.read_csv(f"{metrics_dir}/article_feature_matrix.csv")
```

## Key files

| File | Grain | Purpose |
|------|-------|---------|
| `articles_core.csv` | 1 row/article | All metadata fields; pipe-delimited for multi-label |
| `articles.csv` | 1 row/article | Same + full summary text |
| `article_features_long.csv` | 1 row/assignment | Tidy format; filter by `feature_group` |
| `article_feature_matrix.csv` | 1 row/article | Binary columns across all feature groups |
| `feature_counts.csv` | 1 row/value | Article counts and percentages per feature |
| `feature_cooccurrence.csv` | 1 row/pair | Co-occurring feature pairs (≥2 articles) |

## Counting conventions

- Counts represent coded article presence, not prose term frequency.
- Multi-label fields (Audience, Evidence_Type, Intended_Outcome, Service_Area) may contribute multiple assignments per article.
- `article_pct` = article_count / total_articles × 100
- `article_pct_in_year` uses same-year article count as denominator.

## Schema fields

- **Source_Type**
- **Peer_Review**
- **Evidence_Type** (multi-label)
- **Primary_Methodology**
- **Library_Context**
- **Game_Format**
- **Service_Area** (multi-label)
- **Audience** (multi-label)
- **Intended_Outcome** (multi-label)
- **Evidence_Confidence**
- **Service_Conditions_Addressed**
- **Conceptual_Theme**
- **Coding_Confidence**

## Undated records

1 article(s) have no year and are labelled `n.d.` in year summaries.
