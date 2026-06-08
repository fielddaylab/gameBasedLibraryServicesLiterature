# Conduct Two Runtime-Structure Publishability Reviews

This prompt can run without conversation history. Resolve `PROJECT_ROOT` and
read:

- the live baseline;
- the runtime manifest and disposable run-state location;
- `0-human-sources/publishability_rubric.md`;
- `2-outputs/SECOND_DRAFT.md`;
- all working ledgers;
- every current audit file.

Do not consult an earlier manuscript as an authority. Scores are internal
editorial diagnostics, not peer review or publication decisions.

## Blocking Structural Rule

At the start and end of each round, independently reparse the baseline and
compare every H1-H6 heading with the manuscript after removing only trailing
drafting annotations. A missing, added, renamed, re-leveled, duplicated, or
reordered heading is a blocking defect and must be corrected from the live
baseline, never from memory.

## Round One

Review `SECOND_DRAFT.md` against every weighted rubric criterion. Evaluate:

- contribution and field-level framing;
- thematic and cross-study synthesis;
- evidence calibration and methodological transparency;
- agreements, disagreements, null findings, and outliers;
- comparison across library contexts and game forms;
- equity, accessibility, and participation;
- practice implications and research agenda;
- organization, transitions, concision, and scholarly voice;
- baseline-prose traceability and word-target adherence;
- complete corpus accounting;
- bidirectional citation integrity.

Write findings, criterion scores, total score, and required revisions under
`# Internal Editorial Review Round One` in
`2-outputs/audits_and_synthetic_reviews/reviewer_notes.md`.

Revise the complete manuscript, synchronize affected ledgers and audits, and
save `2-outputs/THIRD_DRAFT.md`. Append a concise revision record. If no text
changes are warranted, state that explicitly and do not claim otherwise.

## Round Two

Conduct a genuinely independent review of `THIRD_DRAFT.md` against the rubric
and newly reparsed structure. Look specifically for residual source-led prose,
weak framing paragraphs, repetition, unsupported generalization, missing
counterevidence, equity blind spots, target overruns, citation problems,
traceability gaps, and venue-readiness concerns.

Append findings and scores under
`# Internal Editorial Review Round Two`.

Revise again, synchronize audits, and save `2-outputs/FINAL_DRAFT.md`. If no
further text changes are warranted, document that explicitly.

## Final Assessment

Append `# Final Internal Assessment` containing:

- final criterion and total scores;
- a clear internal recommendation;
- unresolved bibliography items;
- corpus and baseline-prose caveats;
- word-target deviations;
- venue-specific next steps;
- a statement that the assessment is synthetic and internal.

Finally, compare checksums for `SECOND_DRAFT.md`, `THIRD_DRAFT.md`, and
`FINAL_DRAFT.md`, explain any identical stages, and perform one last H1-H6
parity check against the live baseline.
