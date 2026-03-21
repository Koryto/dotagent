# Standard Workflow
<!-- WORKFLOW_VERSION: 1.2 | STATUS: draft | TYPE: implementation -->

## Purpose

Default gated workflow for implementation work, supporting both standard sequential execution and parallel execution using sub-agents.

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
4. Include:
   - scope
   - affected files or systems
   - implementation steps
   - risks
   - verification approach
5. For tasks where parallel execution is applicable (e.g., large independent workstreams):
   - Create ONE unified master plan (`tasks/{task_name}_ip.md`); DO NOT create separate plans for each sub-agent.
   - Inside the plan, divide the work into detailed batches/workstreams for each agent.
   - Explicitly define file/directory boundaries assigned to each agent's batch. Assure no two agents edit the same file.

Gate: user approves the plan.

### Phase 2: Implementation

Goal: execute the approved plan.

1. Follow the plan.
2. For parallel execution:
   - Spawn sub-agents for each assigned batch from the unified plan.
   - Sub-agents must ONLY modify their assigned files. DO NOT let sub-agents modify out of scope or assume missing parts.
   - Sub-agents DO NOT coordinate or communicate with other agents mid-task.
   - Instruct sub-agents to maintain their own state, notes, and individual reviews under `tasks/{task_name}_{workstream_name}/`.
   - If an agent detects a conflict, it must stop and report immediately.
3. Validate changes while implementing.
4. Record modified and created files.
5. Record meaningful deviations from plan.
6. For large tasks, work in batches and report between them.

Gate: implementation is ready for review (all sub-agents completed if parallel).

### Phase 3: Review

Goal: perform mandatory self-review before presenting completion.

1. For parallel execution, dynamically merge streams ONE BY ONE. Validate and perform integration synthesis (normalize naming, align code styles).
2. Load the `code-review` skill on demand.
3. Review the changes.
4. Write `tasks/{task_name}_review.md` for substantial tasks.
5. Fix findings and re-review until no unresolved findings remain, unless the user explicitly accepts them.
6. Release the skill from active context after review.

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

## Anti-Patterns (Avoid)

❌ Overlapping workstreams
❌ Shared file edits between parallel agents
❌ Agents communicating mid-task
❌ Skipping merge validation
❌ Weak planning or guessing boundaries

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
