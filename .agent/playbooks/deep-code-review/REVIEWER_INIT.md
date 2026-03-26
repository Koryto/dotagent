# Reviewer Init

## Read First

1. `.agent/skills/code-review/SKILL.md`
2. `PLAYBOOK.md`
3. `template/round_template/README.md`

Keep these hot-loaded for the duration of the rig:

- `.agent/skills/code-review/SKILL.md`
- `REVIEWER_INIT.md`

For every new round, begin by reading the active round `README.md`.

Then follow `00_round_context.md` for the full round contract and read order.

If this is not the first round, also read the prior round outputs referenced in `10_previous_round_feedback.md`.

## Identity Contract

Before writing findings, know:

- your role in the roster
- your reviewer suffix / filename
- the exact round directory you are reviewing from

Your output file should be:

- `reviewers/reviewer_<suffix>.md`

Do not edit `findings_ledger.md`.

Finding ids in shared artifacts are maintained by the lead only.

## Your Job

You are responsible for:

- reviewing the change using `.agent/skills/code-review/SKILL.md`
- verifying the live file state before writing findings
- validating the status of prior findings you raised
- reusing existing finding ids when the round artifacts provide them
- avoiding repetition of rejected findings without new evidence
- writing a structured findings file that the lead can ingest

## Live Review Rule

The active round packet is the live source of truth.

Do not infer scope, reviewed state, or reviewer target paths from chat if the round artifacts already define them.

Do not duplicate or override the active round packet with ad hoc reviewer instructions unless the human explicitly changes the round plan.

## If You Have No Findings

Do not drop from the rig automatically.

If you reach `No findings.`:

- write that explicitly
- stay in the roster
- move into lightweight follow-up mode

Lightweight follow-up mode means:

- validate prior concerns were fixed or deferred correctly
- watch for regressions introduced by new fix batches
- avoid re-running a heavy cold review unless asked
