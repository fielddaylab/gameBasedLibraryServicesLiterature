# Summary Quality Rubric

Rubric ID: `gbls_summary_quality`

Version: `1.0.0`

This rubric evaluates whether an article summary is suitable for use in the
Games-Based Library Services literature review. Each dimension is scored from
1 to 3. The machine-readable block below is the authoritative definition used
by the coding interface and its server-side validation.

```json rubric
{
  "id": "gbls_summary_quality",
  "version": "1.0.0",
  "scoreMinimum": 1,
  "scoreMaximum": 3,
  "dimensions": [
    {
      "id": "accuracy",
      "label": "Factual accuracy",
      "description": "How faithfully does the summary represent the source?",
      "levels": [
        "Major errors or unsupported claims",
        "Mostly accurate; minor issues",
        "Accurate and well supported"
      ]
    },
    {
      "id": "coverage",
      "label": "Coverage & completeness",
      "description": "Does it capture the source's important purpose, methods, findings, and implications?",
      "levels": [
        "Important content is missing",
        "Covers most major content",
        "Comprehensive and well balanced"
      ]
    },
    {
      "id": "clarity",
      "label": "Clarity & usefulness",
      "description": "Is the summary readable and useful for synthesis?",
      "levels": [
        "Hard to use or unclear",
        "Generally clear and useful",
        "Exceptionally clear and synthesis-ready"
      ]
    }
  ]
}
```

## Versioning

Increment the version whenever a dimension, description, score label, or scoring
range changes. Use a major-version increment when scores from the revised rubric
should not be compared directly with earlier scores.
