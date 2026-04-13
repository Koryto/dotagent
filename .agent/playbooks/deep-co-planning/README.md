# Deep Co-Planning

`deep-co-planning` is a structured planning playbook for phase-level design work.

It helps turn a human-led high-level direction into implementation-driving specs through reviewer pressure and explicit approval gates.

Use this playbook when:

- the work is broader than one normal task plan
- the design needs pressure before implementation begins
- the expected output should guide multiple implementation tasks
- the human wants explicit approval before implementation planning proceeds

Do not use it for:

- small implementation tasks
- already-obvious patches
- design work where a short inline plan is enough

## Roles

- lead: runs the planning discussion, drafts the HLD/spec artifacts, synthesizes reviewer feedback, and prepares round results
- reviewer: challenges the planning artifacts and writes feedback into the assigned reviewer file
- human: decides `approved` or `another_round`

## How It Works

- the lead starts with open discussion before hardening the HLD
- reviewers challenge scope, risks, sequencing, and missing constraints
- approved HLD work can produce one or more implementation-driving specs

## How To Start

Lead:

```text
$dotagent-dcp-lead-init task_name=<task_name>
```

Reviewer:

```text
$dotagent-dcp-reviewer-init task_name=<task_name> suffix=<reviewer_suffix> [domain=<domain>]
```

The HLD is the output of early planning, not the first interaction.

## Output

A completed run should leave:

- HLD artifact
- reviewer feedback
- lead synthesis
- one or more implementation-driving specs when the HLD is approved
- final human verdict

Use `another_round` when the HLD or specs need another review cycle. Use `approved` to advance from HLD to specs, or to close the final spec round.
