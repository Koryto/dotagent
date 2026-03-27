---
name: "dcp-lead-init"
description: "Start Deep Co-Planning as the lead for an active planning run."
invocation-args:
  task_name: required
---

# dcp-lead-init

Do not start this playbook implicitly.

Bind the lead run to an explicit `task_name` at invocation time.

## Read First

1. `.agent/playbooks/deep-co-planning/PLAYBOOK.md`
2. `.agent/playbooks/deep-co-planning/transport.md`
3. `.agent/playbooks/deep-co-planning/template/round_template/README.md`

Keep these hot-loaded for the duration of the playbook:

- `.agent/playbooks/deep-co-planning/PLAYBOOK.md`
- `.agent/playbooks/deep-co-planning/skills/dcp-lead-init/SKILL.md`

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
- maintaining known unknowns inside the HLD or final specs
- closing each round with the human's verdict

## Operator Path

Use the CLI to initialize the runtime:

```text
dotagent playbook init deep-co-planning --task <task_name>
```

Do not manually scaffold the planning filesystem unless you are explicitly handling a fallback case.

Only the lead updates shared synthesis artifacts.

## Round Creation Rules

- initialize the first round through the CLI
- create another round only when the human explicitly asks for one
- when `another_round` is requested, create the next round, carry forward the required artifacts, and wait until the new packet is ready before reviewers begin
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

For every new round, start from the active round `README.md`.

Treat `00_round_context.md` as the full round contract.

## Human Interaction Points

Engage the human when:

- the run is just starting and the planning target still needs to be understood through open discussion
- scope is too broad or too narrow for this playbook
- the HLD needs correction before reviewers start
- reviewer domain assignment is unclear
- open questions arise during a round
- an `approved` verdict is being requested for the HLD or the final specs
- another round is recommended

At kickoff, start naturally.

Do not rush straight into HLD prompts.

Prefer opening questions such as:

- what do you want to build?
- what do you want to plan in this session?

Use the discussion to discover the real planning target, then translate it into the HLD structure.
