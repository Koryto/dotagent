---
name: "dcp-reviewer-init"
description: "Join Deep Co-Planning as a reviewer for an active planning run."
---

# dcp-reviewer-init

## Read First

1. `.agent/playbooks/deep-co-planning/PLAYBOOK.md`
2. `.agent/playbooks/deep-co-planning/template/round_template/README.md`

Keep these hot-loaded for the duration of the playbook:

- `.agent/playbooks/deep-co-planning/PLAYBOOK.md`
- `.agent/playbooks/deep-co-planning/skills/dcp-reviewer-init/SKILL.md`

For every new round, begin by reading the active round `README.md`.

Then follow `00_round_context.md` for the full round contract and read order.

If this is not the first round, also read the prior round outputs referenced in `10_previous_round_feedback.md`.

## Identity Contract

Before writing feedback, know:

- your role in the roster
- your reviewer suffix / filename
- your assigned domain when one exists
- the exact round directory you are reviewing from

Your output file should be:

- `reviewers/reviewer_<suffix>.md`

Do not edit shared synthesis artifacts.

## Your Job

You are responsible for:

- reviewing the active HLD or spec artifacts independently
- checking scope, sequencing, feasibility, architecture, interfaces, verification, and decomposition quality
- raising concrete concerns instead of vague planning preferences
- keeping feedback technical and reviewable
- writing a structured critique that the lead can ingest

## Live Review Rule

The active round packet is the live source of truth.

Do not infer scope, artifacts, or reviewer target paths from chat if the round artifacts already define them.

Do not replace the active round packet with ad hoc reviewer instructions unless the human explicitly changes the plan.

## If the Work Looks Mis-Scoped

Say so directly.

Common cases:

- the work is too narrow and should just use the standard workflow
- the HLD is too broad and should probably be broken into smaller planning units

These are recommendations to the human, not hard stops.
