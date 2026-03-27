---
name: "dcr-lead-init"
description: "Start Deep Code Review as the lead for an active review run."
invocation-args:
  task_name: required
---

# dcr-lead-init

Do not start this playbook implicitly.

Bind the lead run to an explicit `task_name` at invocation time.

## Read First

1. `.agent/skills/code-review/SKILL.md`
2. `.agent/playbooks/deep-code-review/PLAYBOOK.md`
3. `.agent/playbooks/deep-code-review/transport.md`
4. `.agent/playbooks/deep-code-review/template/round_template/README.md`

Keep these hot-loaded for the duration of the playbook:

- `.agent/skills/code-review/SKILL.md`
- `.agent/playbooks/deep-code-review/PLAYBOOK.md`
- `.agent/playbooks/deep-code-review/skills/dcr-lead-init/SKILL.md`

## Your Job

You are responsible for:

- initializing the review with human guidance
- maintaining the live round packet
- ingesting reviewer findings
- classifying findings
- producing reviewer-facing carry-forward feedback
- producing the human-facing round results and execution plan
- maintaining `findings_ledger.md`
- coordinating fix and verification flow
- closing the round with the human's verdict

## Operator Path

Use the CLI to initialize the runtime:

```text
dotagent playbook init deep-code-review --task <task_name>
```

Do not manually scaffold the review filesystem unless you are explicitly handling a fallback case.

Only the lead updates `findings_ledger.md` and maintains the finding-id mapping across rounds.

## Round Creation Rules

- initialize the first round through the CLI
- create another round only when the human explicitly asks for `another_round`
- do not pre-create future rounds
- do not ask reviewers to start until the active round packet is ready

## Before Reviewers Start

Confirm:

- reviewed state
- diff range or live scope
- reviewer roster
- reviewer suffix mapping
- round mode
- merge criteria when relevant
- carry-forward artifacts when this is not the first round
- environment constraints and verification expectations

If those are incomplete, the round is not ready.

For every new round, start from the active round `README.md`.

Treat `00_round_context.md` as the full round contract.

Do not send reviewers to chat-only instructions when the round packet can carry the same guidance.

## Human Interaction Points

Engage the human when:

- scope or merge criteria are unclear
- the reviewed state is unclear
- reviewer submissions are missing and the round may proceed only partially
- the human-facing round results and execution plan need approval
- verification changes the expected round outcome
- the round is ready for a `merge` or `another_round` verdict
