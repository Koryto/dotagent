# Parallel Workflow
<!-- WORKFLOW_VERSION: 1.2 | STATUS: draft | TYPE: implementation -->

## Purpose

Gated workflow for implementation work designed to maximize parallel execution using sub-agents. 
It marries the strict phase structure of the standard workflow with rigorous isolation rules to prevent conflicts and ensure a clean final result.

Keep this file hot-loadable: phases, gates, and references only.

## Core Principle

> Plan once → Split cleanly → Execute in parallel → Merge safely

## Phases

### Phase 1: Planning (Workstream Definition)

Goal: clarify scope and produce a master plan that perfectly isolates work into independent units.

1. Read the task.
2. If the task needs missing or unclear design intent:
   - clarify with the user
   - create or update the relevant spec before detailed implementation planning
3. Create the master plan `tasks/{task_name}_ip.md` containing:
   - full scope and architecture overview
   - breakdown of the system into independent workstreams
   - explicit file/directory boundaries assigned to each workstream
4. Define constraints:
   - Golden Rule: if two individual agents touch the same file, the design is wrong. Shared logic must have a single owner.
   - For each workstream define: Name, Description, Files owned, Inputs, and Outputs.
5. Create separated sub-plans for each workstream: `tasks/{task_name}_{workstream_name}_ip.md`.

Gate: user approves the master plan and strict workstream division.

### Phase 2: Parallel Execution

Goal: spawn sub-agents to safely execute all workstreams simultaneously.

1. Spawn a sub-agent for each defined workstream.
2. Provide each sub-agent with its specific plan (`tasks/{task_name}_{workstream_name}_ip.md`).
3. Instruct each sub-agent with STRICT execution rules:
   - ONLY modify assigned files in the scope.
   - DO NOT assume or implement missing parts outside your scope.
   - DO NOT coordinate or communicate with other agents mid-task.
4. Instruct sub-agents to maintain their state, notes, and individual reviews under `tasks/{task_name}_{workstream_name}/`.
5. Validate individual changes during implementation.
6. If a sub-agent blocks or detects a conflict, it must STOP execution and report the issue immediately.

Gate: all sub-agents have completed their isolated implementations.

### Phase 3: Merge Phase & Review

Goal: structurally combine parallel outputs, resolve integrating edges, and perform self-review.

1. Collect outputs from all sub-agents.
2. Merge workstreams ONE BY ONE, avoiding blind overwrites.
3. Validate integrations after each merge.
4. Final Synthesis: normalize naming conventions, refactor any duplicated logic that emerged, and align coding styles.
5. Load the `code-review` skill on demand.
6. Review the fully combined changes.
7. Write `tasks/{task_name}_review.md`. 
8. Fix findings and re-review until no unresolved findings remain.
9. Release the skill from active context.

Gate: integrated self-review completed.

### Phase 4: Validation

Goal: ensure correctness and completeness through system execution.

1. Choose the verification method for the whole system.
2. Verify all requirements are met and validate against the original request.
3. Run verification with permission when required.
4. Write `tasks/{task_name}_verification.md`.
5. If verification fails:
   - fix the issue
   - re-review if the fix is non-trivial
   - re-verify
6. If verification cannot be run:
   - say so explicitly
   - state the remaining risk

Gate: combined verification passes, or the user accepts the remaining risk.

### Phase 5: Summary

Goal: close the task cleanly.

1. Load the `closeout` skill on demand.
2. Execute the closeout process, summarizing the parallel execution.
3. Release the skill from active context.

## Anti-Patterns (Avoid)

❌ Overlapping workstreams
❌ Shared file edits between parallel agents
❌ Agents communicating mid-task
❌ Skipping merge validation
❌ Weak planning or guessing boundaries

## Rules

Always:
- keep `specs/` and `systems/` separated by truth type
- assign explicit, non-overlapping file ownership to each sub-agent
- perform merge synthesis and review for the integrated system before calling work done
- be explicit about unresolved risk

Never:
- skip master planning when delegating to sub-agents
- allow sub-agents to write state files outside their designated sub-task directory
- treat verification as optional when real risk exists
- present unreviewed code as done
- auto-promote task knowledge into `project/`
