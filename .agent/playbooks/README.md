# Playbooks

`playbooks/` stores reusable operational packages that are too large, stateful, or role-dependent to fit in a single skill.

Use a playbook when the work needs:

- multiple participants or roles
- rounds, phases, or explicit gates
- durable state across sessions
- more structure than a skill or normal workflow can provide

Do not use a playbook for ordinary implementation work. Use the `standard` workflow unless the task needs the extra structure.

## Playbooks vs Skills

Use a skill when:

- one file is enough
- the task is narrow and repeatable
- one procedural interface is sufficient

Use a playbook when:

- the procedure needs multiple artifacts
- state must persist across rounds or participants
- different agents need different entrypoints
- the process is too large to keep in one hot-loaded skill

## Bundled Playbooks

- `deep-code-review` runs a structured multi-agent review loop for large or high-risk changes
- `deep-co-planning` turns a human-led HLD into implementation-driving specs through structured reviewer pressure

## Runtime Model

Playbooks are started through native entry skills, not by manually opening template files.

Common entry skills:

- `dcr-lead-init`
- `dcr-reviewer-init`
- `dcp-lead-init`
- `dcp-reviewer-init`

The CLI scaffolds the playbook runtime packet. Markdown artifacts remain the contract between the lead, reviewers, and human operator.
