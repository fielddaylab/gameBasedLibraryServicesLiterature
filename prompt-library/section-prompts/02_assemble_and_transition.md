# Assemble And Integrate Runtime Sections

This prompt can run without conversation history. Resolve `PROJECT_ROOT`, read
the shared contract and live baseline, and load all completed section texts and
ledgers from the active run-state identified in
`runtime_structure_manifest.md`. Do not use an older file in `2-outputs` as a
draft seed.

## First Assembly

1. Reparse the baseline from disk into an ordered H1-H6 manifest.
2. Match each completed section to its runtime ID, ordinal position, source
   line span, and heading fingerprint.
3. Stop if a section is missing, duplicated, stale, or structurally mismatched.
4. Assemble sections strictly by current H1 ordinal position.
5. Preserve substantive baseline ideas and source-supported distinctions.
6. Remove only accidental boundary duplication introduced by separate drafting.
7. Save this literal first complete assembly as
   `PROJECT_ROOT/2-outputs/FIRST_DRAFT.md`.
8. Verify complete heading parity with the live baseline.

## Integration Pass

Read the manuscript as a single argument. Infer section functions from the
live baseline rather than a predefined topic model.

Revise the whole manuscript to:

- create cumulative argument and accurate transitions;
- remove unnecessary repetition without erasing meaningful differences;
- harmonize terminology, citation style, evidentiary language, and voice;
- ensure each substantive heading opens with synthesis;
- preserve null findings, outliers, context differences, and limitations;
- connect findings to library practice without overstating evidence;
- support, qualify, or label baseline propositions;
- keep audits and ledgers synchronized with textual revisions;
- account for word-target deviations.

Save the integrated manuscript as
`PROJECT_ROOT/2-outputs/SECOND_DRAFT.md`.

## Verification

Reparse the baseline after integration and compare every H1-H6 heading for
wording, level, count, and order. Calculate word counts and checksums for both
drafts. If the drafts are identical, document why no integration change was
warranted; otherwise summarize the material changes in the review record.
