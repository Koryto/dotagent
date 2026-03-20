# Filesystem Transport
<!-- VERSION: 0.1 | STATUS: experimental -->

## Purpose

Define the current supported transport for `the-extreme-cr-rig`.

This transport uses the local filesystem as the communication and artifact surface for rig rounds.

## Why Filesystem First

The filesystem transport is:

- easy to inspect
- easy to debug
- easy to operate manually
- a good artifact model for future operator layers to build on

## Round Workspace

Each review round should use a dedicated workspace directory.

Recommended structure:

```text
<repo>/.ecrr/<task_name>/round_001/
|-- 00_round_context.md
|-- 10_previous_round_feedback.md
|-- README.md
|-- reviewers/
|   |-- reviewer_alpha.md
|   |-- reviewer_beta.md
|   `-- reviewer_gamma.md
|-- lead/
|   |-- 20_reviewer_feedback.md
|   `-- 30_round_results.md
|-- verification/
|   |-- batch_001.md
|   `-- batch_002.md
`-- 60_round_verdict.md
```

## Artifact Purpose

- `00_round_context.md`
  - round scope
  - reviewed state / branch pair
  - change summary
  - relevant project rules
  - human-owned merge criteria when relevant
  - out-of-scope items
  - Wingman roster

- `10_previous_round_feedback.md`
  - summary of prior round outcomes relevant to this round
  - prior reviewer-facing carry-forward references
  - prior human-facing round-results references
  - prior verdict references

- `README.md`
  - small round-local operator guide
  - exact file flow for this round

- `reviewers/reviewer_<name>.md`
  - one Wingman's findings
  - confirms review basis against current file state
  - includes follow-up on that Wingman's prior findings when applicable

- `lead/20_reviewer_feedback.md`
  - reviewer-facing carry-forward artifact
  - classification of Wingman findings
  - stale/rejected/deferred guidance for future rounds

- `lead/30_round_results.md`
  - human-facing round results
  - accepted findings
  - dropped / deferred notes as needed
  - execution plan / fix batches
  - approval request for the human
  - may be compact in quick rounds

- `verification/batch_<n>.md`
  - verification results and regression notes for each fix batch

- `60_round_verdict.md`
  - round closeout
  - human verdict: `merge` or `another_round`
  - unresolved risks
  - next action

## Operating Flow

1. Stinson creates `<repo>/.ecrr/<task_name>/round_00X/`.
2. Stinson copies the contents of `filesystem/round_template/` into the new round.
3. Stinson fills `00_round_context.md` with human guidance.
4. Stinson fills `10_previous_round_feedback.md` before Wingmen begin when the round is not the first round.
5. Wingmen read the populated round files and write findings files.
6. Stinson produces reviewer-facing feedback and the human-facing round results.
7. The human approves the round results or requests another Stinson pass.
8. Fixes are applied and verified batch by batch.
9. The human decides `merge` or `another_round`, and Stinson records that in `60_round_verdict.md`.

## Transport Rules

- one reviewer file per Wingman
- no hidden state outside round artifacts
- the round should not start until required files are populated
- reviewer-facing and human-facing Stinson outputs serve different audiences and should stay distinct
- verification must be written down, not assumed
- completed rounds should remain readable for later reference
- Wingmen should have explicit access to prior round feedback before starting the next round
