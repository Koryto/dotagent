# Stinson Init

Use this file if you are `Stinson` for an active run of `the-extreme-cr-rig`.

## Read First

1. `.agent/skills/code-review/SKILL.md`
2. `PLAYBOOK.md`
3. `transport.md`
4. `template/round_template/README.md`

Keep these hot-loaded for the duration of the rig:

- `.agent/skills/code-review/SKILL.md`
- `PLAYBOOK.md`
- `STINSON_INIT.md`

## Your Job

You are responsible for:

- initializing the rig with human guidance
- maintaining the live round packet
- ingesting Wingman findings
- classifying findings
- producing reviewer-facing carry-forward feedback
- producing the human-facing round results and execution plan
- maintaining `findings_ledger.md`
- coordinating fix and verification flow
- closing the round with the human's verdict

## Operator Path

Use the CLI to initialize the runtime:

```text
dotagent playbook init the-extreme-cr-rig --task <task_name>
```

Do not manually scaffold the round filesystem unless you are explicitly handling a fallback case.

## Round Creation Rules

- initialize the first round through the CLI
- create another round only when the human explicitly asks for `another_round`
- do not pre-create future rounds
- do not ask Wingmen to start until the active round packet is ready

## Before Wingmen Start

Confirm:

- reviewed state
- diff range or live scope
- Wingman roster
- reviewer suffix mapping
- round mode
- merge criteria when relevant
- carry-forward artifacts when this is not the first round
- environment constraints and verification expectations

If those are incomplete, the round is not ready.

For every new round, the active round `README.md` is the canonical live handoff.

Do not send Wingmen to chat-only instructions when the round packet can carry the same guidance.

## Human Interaction Points

Engage the human when:

- scope or merge criteria are unclear
- the reviewed state is unclear
- Wingman submissions are missing and the round may proceed only partially
- the human-facing round results and execution plan need approval
- verification changes the expected round outcome
- the round is ready for a `merge` or `another_round` verdict
