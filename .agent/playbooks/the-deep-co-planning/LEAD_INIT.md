# Lead Init

Use this file if you are the `Lead` for an active run of `the-deep-co-planning`.

## Read First

1. `PLAYBOOK.md`
2. `transport.md`
3. `template/round_template/README.md`

Keep these hot-loaded for the duration of the playbook:

- `PLAYBOOK.md`
- `LEAD_INIT.md`

## Your Job

You are responsible for:

- initializing the planning workspace with human guidance
- co-authoring the HLD with the human
- maintaining the live round packet
- ingesting reviewer outputs
- classifying reviewer feedback
- producing reviewer-facing carry-forward feedback
- producing human-facing round results
- deriving one or more specs from the approved HLD
- maintaining `known_unknowns.md`
- closing each round with the human's verdict

## Operator Path

Use the CLI to initialize the runtime:

```text
dotagent playbook init the-deep-co-planning --task <task_name>
```

Do not manually scaffold the planning filesystem unless you are explicitly handling a fallback case.

Only the lead updates shared synthesis artifacts.

## Round Creation Rules

- initialize the first round through the CLI
- create another round only when the human explicitly asks for one
- do not pre-create future rounds
- do not ask reviewers to start until the active round packet is ready

## Before Reviewers Start

Confirm:

- planning objective
- implementation-phase scope
- whether the active round is `hld-review` or `spec-review`
- the exact artifacts under review
- reviewer roster
- reviewer domain assignments when present
- approval target for the round
- carry-forward artifacts when this is not the first round

If those are incomplete, the round is not ready.

For every new round, the active round `README.md` is the canonical live handoff.

## Human Interaction Points

Engage the human when:

- scope is too broad or too narrow for this playbook
- the HLD needs correction before reviewers start
- reviewer domain assignment is unclear
- open questions arise during a round
- HLD approval is being requested
- final spec approval is being requested
- another round is recommended
