---
description: 
---

# Standard Workflow
<!-- WORKFLOW_VERSION: 1.2 | STATUS: draft | TYPE: implementation -->

## Purpose

Default gated workflow for implementation work.

Keep this file hot-loadable: phases, gates, and references only.

## Phases

### Phase 1: Planning

Goal: clarify scope and produce an implementation plan.

1. Read the task.
2. If the task needs missing or unclear design intent:
   - clarify with the user
   - create or update the relevant spec before detailed implementation planning
3. Create the plan:
   - substantial tasks: `tasks/{task_name}_ip.md`
   - simple tasks: inline in chat
   - parallel tasks: explicitly define file/directory boundaries assigned to each agent's batch (assure no two agents edit the same file)
4. Include:
   - scope
   - affected files or systems
   - implementation steps (divide work into detailed batches/workstreams for each agent)
   - risks
   - verification approach

Gate: user approves the plan.

### Phase 2: Implementation

Goal: execute the approved plan.

1. Follow the plan.
2. Validate changes while implementing.
3. Record modified and created files.
4. Record meaningful deviations from plan.
5. For large tasks, work in batches and report between them.

Gate: implementation is ready for review (all sub-agents completed if parallel).

### Phase 3: Review

Goal: perform mandatory self-review before presenting completion.

1. Load the `code-review` skill on demand.
2. Review the changes.
3. Write `tasks/{task_name}_review.md` for substantial tasks.
4. Fix findings and re-review until no unresolved findings remain, unless the user explicitly accepts them.
5. Release the skill from active context after review.

Gate: self-review completed.

### Phase 4: Verification

Goal: verify behavior through execution.

1. Choose the verification method.
2. Ask the user only if the verification path is unclear.
3. Run verification with permission when required.
4. Write `tasks/{task_name}_verification.md` for substantial tasks.
5. If verification fails:
   - fix the issue
   - re-review if the fix is non-trivial
   - re-verify
6. If verification cannot be run:
   - say so explicitly
   - state the remaining risk

Gate: verification passes, or the user accepts the remaining risk.

### Phase 5: Summary

Goal: close the task cleanly.

1. Load the `closeout` skill on demand.
2. Execute the closeout process.
3. Release the skill from active context after summary.

## Rules

Always:
- keep `specs/` and `systems/` separated by truth type
- perform review before calling work done
- distinguish review from verification
- be explicit about unresolved risk
- assign explicit, non-overlapping file ownership to each sub-agent when working in parallel

Never:
- skip planning when a plan is needed
- treat verification as optional when real risk exists
- present unreviewed code as done
- auto-promote task knowledge into `project/`
- allow sub-agents to share file scope or write outside their designated sub-task assignments
