# Round Packet

This file is the entry point for the active review round.

## Read Order

1. `../findings_ledger.md`
2. `00_round_context.md`
3. `10_previous_round_feedback.md` when this is not the first round

If `10_previous_round_feedback.md` references prior round artifacts, read those before writing findings.

## Write Targets

- `reviewers/reviewer_<suffix>.md`
- `lead/20_reviewer_feedback.md`
- `lead/30_round_results.md`
- `60_round_verdict.md`

Use `00_round_context.md` as the full round contract.

## Missing-Artifact Policy

- if this requested round does not exist, stop and wait
- do not infer missing round state from chat or git history
- do not start until the active round packet is populated
