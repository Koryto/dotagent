# Filesystem Runtime
<!-- VERSION: 1.0 | STATUS: active -->

## Purpose

Define the intended runtime model for `deep-code-review`.

This playbook runs through the local filesystem. The CLI scaffolds the runtime. Markdown artifacts remain the review contract.

## Why Filesystem

The filesystem runtime is:

- easy to inspect
- easy to debug
- easy to review with normal repository tooling
- stable enough to serve as the intended operating model for this playbook

## Runtime Workspace

Each review round uses a dedicated workspace directory.

Expected structure:

```text
<repo>/.dcr/<task_name>/
|-- findings_ledger.md
`-- round_001/
    |-- 00_round_context.md
    |-- 10_previous_round_feedback.md
    |-- README.md
    |-- reviewers/
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
  - exact round scope
  - reviewed state / branch pair
  - change summary
  - relevant project rules
  - human-owned merge criteria when relevant
  - out-of-scope items
  - reviewer roster

- `10_previous_round_feedback.md`
  - summary of prior round outcomes relevant to this round
  - carry-forward references

- `findings_ledger.md`
  - cumulative findings memory for the task
  - stable ids across rounds
  - current disposition of previously accepted findings

- `README.md`
  - entry point for the active round
  - points reviewers and the lead to the full round contract

- `reviewers/reviewer_<suffix>.md`
  - one reviewer's findings
  - created or assigned once the roster is known
  - confirms review basis against current file state
  - includes follow-up on prior findings when applicable

- `lead/20_reviewer_feedback.md`
  - reviewer-facing carry-forward artifact
  - classification of reviewer findings
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
  - human verdict: `approved` or `another_round`
  - unresolved risks
  - next action

## CLI Responsibility

The CLI is responsible for:

- initializing the runtime root
- scaffolding task-level artifacts such as `findings_ledger.md`
- scaffolding the first round from the template
- preserving the expected directory shape

Future round creation remains human-gated.

## Runtime Rules

- one reviewer file per reviewer
- no hidden state outside the runtime artifacts
- the round should not start until required files are populated
- reviewer files are outputs, not required pre-existing scaffold files
- reviewer-facing and human-facing lead outputs serve different audiences and should stay distinct
- verification must be written down, not assumed
- completed rounds should remain readable for later reference
- reviewers should have explicit access to prior round feedback before starting the next round
- reviewers stop if the requested next round does not exist; they do not infer it
- if the human asks for `another_round`, the lead creates the next round and carries forward the required artifacts before reviewers start
