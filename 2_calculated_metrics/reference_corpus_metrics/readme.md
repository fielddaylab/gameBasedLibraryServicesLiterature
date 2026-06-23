# GBLS Reference Corpus Metrics

Generated: 2026-06-23 13:58
Articles: 7201 | Journals: 6 | Feature assignments: 76861
Coding basis: abstract-only

## Quick start

```python
import pandas as pd
metrics_dir = "2_calculated_metrics/reference_corpus_metrics"
articles = pd.read_csv(f"{metrics_dir}/articles.csv")
features = pd.read_csv(f"{metrics_dir}/article_features_long.csv")
matrix   = pd.read_csv(f"{metrics_dir}/article_feature_matrix.csv")
```

All coding in this corpus is based on article titles and abstracts only.
It is not a substitute for full-text review.
