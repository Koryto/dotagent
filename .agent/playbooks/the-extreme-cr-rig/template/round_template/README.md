# Round Packet

This file is the canonical live handoff for the active round.

Reviewers should start here after reading the relevant role-init file.

## Round Identity

- task_name:
- round_id:
- review_mode: full/fix-pass
- reviewed_state:
- prior_reviewed_state:
- diff_reference:
- round_status:

## Review Scope

- review_target:
- focus_areas:
- out_of_scope:

## Read Order

1. `../findings_ledger.md`
2. `00_round_context.md`
3. `10_previous_round_feedback.md` when this is not the first round

If `10_previous_round_feedback.md` references prior round artifacts, read those before writing findings.

## Reviewer Roster

- stinson:
- expected_wingmen:
- reviewer_suffixes:
- reviewer_output_paths:

Reviewer output files are write targets for this round.

Do not assume they already exist before review starts.

## Merge Criteria

- human_merge_criteria:

## Environment Constraints

- os_assumptions:
- runtime_target:
- known_sandbox_limits:

## Verification Expectations

- expected_validation_commands:
- acceptable_substitute_validation:

## Carry-Forward Rules

- accepted_finding_ids_to_verify:
- rejected_or_deferred_items_not_to_re-raise_without_new_evidence:

## Missing-Artifact Policy

- if this requested round does not exist, stop and wait
- do not infer missing round state from chat or git history
- do not start until the packet fields above are filled
