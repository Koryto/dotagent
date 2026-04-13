# Filesystem Runtime
<!-- VERSION: 1.0 | STATUS: active -->

## Purpose

Define the intended runtime model for `deep-co-planning`.

This playbook runs through the local filesystem. The CLI scaffolds the runtime. Markdown artifacts remain the planning contract.

## Why Filesystem

The filesystem runtime is:

- easy to inspect
- easy to debug
- easy to review with normal repository tooling
- stable enough to serve as the intended operating model for this playbook

## Runtime Workspace

Each planning run uses a dedicated workspace directory.

Expected structure:

```text
<repo>/.dcp/<task_name>/
|-- HLD.md
|-- README.md
|-- specs/
|   |-- README.md
|   `-- spec_template.md
`-- round_001/
    |-- 00_round_context.md
    |-- 10_previous_round_feedback.md
    |-- README.md
    |-- reviewers/
    |   `-- reviewer_<name>.md
    |-- lead/
    |   |-- 20_reviewer_feedback.md
    |   `-- 30_round_results.md
    `-- 60_round_verdict.md
```

## Artifact Purpose

- `README.md`
  - task-level planning workspace overview
  - what is being planned
  - current stage and expected output

- `HLD.md`
  - human-led high-level design baseline
  - the design object that reviewers first critique

- `specs/README.md`
  - index for one or more specs derived from the approved HLD

- `specs/spec_template.md`
  - reference structure for spec authoring

- `00_round_context.md`
  - exact round focus
  - active planning artifacts under review
  - reviewer roster and domain assignments
  - approval target for the round

- `10_previous_round_feedback.md`
  - carry-forward summary from prior rounds when another round is requested

- `reviewers/reviewer_<name>.md`
  - one reviewer's critique for the active round

- `lead/20_reviewer_feedback.md`
  - reviewer-facing carry-forward artifact
  - how the lead classified and responded to reviewer input

- `lead/30_round_results.md`
  - human-facing round synthesis
  - what changed
  - what remains disputed
  - questions that require human input
  - approval request for the round target

- `60_round_verdict.md`
  - round closeout
  - human verdict: `approved` or `another_round`
  - next action

## CLI Responsibility

The CLI is responsible for:

- initializing the runtime root
- scaffolding the task-level planning artifacts
- scaffolding the first round from the template
- preserving the expected directory shape

Future round creation remains human-gated.

## Runtime Rules

- one reviewer file per reviewer
- no hidden state outside the runtime artifacts
- the round should not start until required files are populated
- reviewer files are outputs, not required pre-existing scaffold files
- reviewer-facing and human-facing lead outputs serve different audiences and should stay distinct
- the final spec output may be one spec or a spec set depending on HLD scope
- completed rounds should remain readable for later task-level planning and implementation
- if the human asks for `another_round`, the lead creates the next round and carries forward the required artifacts before reviewers start
