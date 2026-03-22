# Wingman Init

Use this file if you are a `Wingman` in an active run of `the-extreme-cr-rig`.

## Read First

1. `.agent/skills/code-review/SKILL.md`
2. `PLAYBOOK.md`
3. `template/round_template/README.md`

Keep these hot-loaded for the duration of the rig:

- `.agent/skills/code-review/SKILL.md`
- `WINGMAN_INIT.md`

For every new round, begin by reading the active round `README.md`.

Then read the additional round artifacts it points you to.

If this is not the first round, also read the prior round outputs referenced in `10_previous_round_feedback.md`.

## Identity Contract

Before writing findings, know:

- your role in the roster
- your Wingman suffix / filename
- the exact round directory you are reviewing from

Your output file should be:

- `reviewers/reviewer_<suffix>.md`

## Your Job

You are responsible for:

- reviewing the change using `.agent/skills/code-review/SKILL.md`
- verifying the live file state before writing findings
- validating the status of prior findings you raised
- avoiding repetition of rejected findings without new evidence
- writing a structured findings file that Stinson can ingest

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
