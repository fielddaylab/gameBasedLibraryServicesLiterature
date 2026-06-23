# GBLS Metrics Explorer

A dependency-free JavaScript dashboard for exploring the coded-summary feature files.

## Open it

Double-click `tools/metrics_explorer/index.html`. The GBLS data is bundled in
`../../2_calculated_metrics/metrics_explorer_synthesized_data.js`, so the dashboard does not require npm,
internet access, or a web server.

If a browser restricts local JavaScript files, run a local server from the
project root:

```bash
python3 -m http.server 8765
```

Then visit `http://localhost:8765/tools/metrics_explorer/`.

Article citations and **Code metadata** links pass the current explorer URL to
the coder. After saving, the coder returns to that explorer location. The
coder must be available at `http://localhost:8787/` for the standalone
explorer.

## Files

- `tools/metrics_explorer/index.html`: dashboard page
- `tools/metrics_explorer/metrics_explorer.js`: filters, SVG charts, and article table
- `tools/metrics_explorer/metrics_explorer.css`: responsive visual design
- `tools/metrics_explorer/reference_corpus_data.js`: generated abstract-coded reference bundle
- `2_calculated_metrics/metrics_explorer_synthesized_data.js`: generated GBLS data bundle
  feature files
- `2_calculated_metrics/gbls_corpus_metrics/`: generated GBLS CSVs, workbook,
  documentation, and validation artifacts
- `2_calculated_metrics/library_journal_reference_metrics/`: reference-corpus
  data, scripts, and generated metric artifacts
