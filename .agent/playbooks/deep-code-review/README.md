# Deep Code Review

`deep-code-review` is a structured review playbook for large or high-risk changes.

It is heavier than normal self-review. Use it when the change deserves multiple reviewer passes, lead synthesis, and explicit human approval before closing.

Use this playbook when:

- the diff is too large for one human and one agent pass to review well
- the touched area is critical or high-risk
- the review needs more structure than normal self-review
- the human wants explicit approval before the change is considered reviewed

Do not use it for:

- tiny patches
- routine low-risk edits
- work that still needs implementation before review

## Roles

- lead: creates the review packet, synthesizes reviewer feedback, tracks findings, and prepares the round result
- reviewer: inspects the requested target and writes findings into the assigned reviewer artifact
- human: decides `approved` or `another_round`

## How It Works

- reviewers work independently before lead synthesis
- findings use stable IDs and round-to-round tracking
- the review remains inspectable through filesystem artifacts instead of ad hoc chat feedback

## How To Start

Lead:

```text
$dotagent-dcr-lead-init task_name=<task_name>
```

Reviewer:

```text
$dotagent-dcr-reviewer-init task_name=<task_name> suffix=<reviewer_suffix> [domain=<domain>]
```

The CLI scaffolds the first round under the playbook runtime root. Reviewers should write only to their assigned reviewer file.

## Output

A completed run should leave:

- reviewer artifacts
- lead synthesis
- findings ledger
- round result
- final human verdict

Use `another_round` when accepted findings need fixes and re-review. Use `approved` when the review is complete.
