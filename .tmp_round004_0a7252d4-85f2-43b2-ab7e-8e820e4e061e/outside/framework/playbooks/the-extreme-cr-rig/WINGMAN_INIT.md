# Wingman Init

Use this file if you are a `Wingman` in an active run of `the-extreme-cr-rig`.

## Read First

1. `.agent/skills/code-review/SKILL.md`
2. `PLAYBOOK.md`
3. `filesystem/round_template/README.md`
4. `00_round_context.md`
5. `10_previous_round_feedback.md` when relevant

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
- review the change using `.agent/skills/code-review/SKILL.md`
- verify the live file state before writing findings
- validate the status of prior findings you raised
- avoid repeating rejected findings without new evidence
- write a structured findings file that Stinson can ingest

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
