# Standard Workflow
<!-- WORKFLOW_VERSION: 2.0 | STATUS: active | TYPE: implementation -->

## Purpose

Default workflow for substantial implementation work.

This workflow is both:

- the agent's execution contract
- the user's visible map of the task lifecycle

Keep this file hot-loadable. It should stay short enough to reload during long sessions.

## Workflow Contract

The agent must:

- announce the active phase when entering it
- make the current gate visible to the user
- update the active session file under `state/sessions/` at task start, phase transitions, pause, and closeout
- reload this workflow before phase transitions and after long exploratory work

The user must:

- approve the plan before implementation starts
- explicitly approve the planned branch/worktree and writable boundary before implementation starts
- explicitly accept unresolved review or verification risk if the task is to proceed anyway
- redirect the workflow explicitly if they want to skip or change the normal path

## Phase 1: Planning

Goal: clarify scope and produce an approved implementation path.

Agent actions:

1. Announce entry into Planning.
2. Update the active session file for an active task in `workflow: standard`, `phase: planning`.
3. Read the task and clarify scope.
4. If design intent is missing or unclear:
   - clarify with the user
   - create or update the relevant `specs/` artifact before detailed implementation planning
5. Choose the planning format:
   - substantial task: `tasks/{task_name}/ip.md`
   - simple task: concise inline plan in chat
6. When the task safely supports parallel decomposition, plan explicit sub-agent ownership during Planning.
7. Include:
   - scope
   - affected files or systems
   - approved branch/worktree for implementation; default worktree location is `.worktrees/<repo_name>_<session_id>` unless the user explicitly approves a different path
   - approved writable boundary for implementation
   - implementation steps
   - risks
   - verification approach
8. Present the plan clearly to the user.

Gate: user approves the plan, branch/worktree, and writable boundary

Do not enter Implementation until this gate is satisfied.

## Phase 2: Implementation

Goal: execute the approved plan without drifting off workflow.

Agent actions:

1. Announce entry into Implementation.
2. Update the active session file to `phase: implementation`.
3. Reload this workflow before starting if Planning was long or exploratory.
4. Create or bind the approved branch/worktree before making implementation changes.
5. Follow the approved plan.
6. Record meaningful deviations from plan.
7. Keep `resume_files` current when the active working set changes materially.
8. During long scans or broad exploratory work:
   - reload the active session file
   - reload this workflow
   - confirm the current pass still serves the approved objective
9. Treat the approved writable boundary as a blocking write contract:
   - if a planned write stays inside the approved boundary, proceed
   - if a write would touch an unapproved file or area, stop and ask the user for explicit approval before writing
   - if approval is granted, update the implementation plan or active plan summary to reflect the expanded boundary before continuing
10. Work in batches when the task is large.
11. Keep the user informed of meaningful progress and deviations.

Gate: implementation is ready for review

Implementation is not "done" when code exists. It is done when the work is ready to survive review.

## Phase 3: Review

Goal: perform mandatory self-review before presenting completion.

Agent actions:

1. Announce entry into Review.
2. Update the active session file to `phase: review`.
3. Load the `code-review` skill on demand.
4. Review the changes.
5. Write `tasks/{task_name}/review.md` for substantial tasks.
6. Fix findings and re-review until there are no unresolved findings, unless the user explicitly accepts them.
7. Make the review result visible to the user and give the human a chance to inspect the work before continuing.
8. Release the skill after review.

Gate: self-review is complete and the user has explicitly approved continuation

Do not present unreviewed implementation as complete.

## Phase 4: Verification

Goal: verify behavior through execution or clearly state remaining risk.

Agent actions:

1. Announce entry into Verification.
2. Update the active session file to `phase: verification`.
3. Choose the verification path.
4. Ask the user only if the correct verification path is unclear.
5. Run verification with permission when required.
6. Write `tasks/{task_name}/verification.md` for substantial tasks.
7. If verification fails:
   - fix the issue
   - re-review if the fix is non-trivial
   - re-verify
8. If verification cannot be run:
   - say so explicitly
   - state the remaining risk

Gate: verification passes, or the user explicitly accepts the remaining risk

## Phase 5: Summary

Goal: close the task cleanly and leave the framework resumable.

Agent actions:

1. Announce entry into Summary.
2. Update the active session file to `phase: summary`.
3. Load the `closeout` skill on demand.
4. Execute the closeout process.
5. Release the skill after summary.

Gate: closeout is complete

## Reload Rules

Reload the active session file under `state/sessions/` and this workflow:

- before every phase transition
- after long exploratory work
- after broad repo scanning
- whenever drift is possible

Reload `project/PROJECT.md` when project-level rules or conventions become relevant again.

## Rules

Always:

- keep `specs/` and `systems/` separated by truth type
- make the phase and gate visible to the user
- perform review before calling work done
- distinguish review from verification
- be explicit about unresolved risk
- keep the active session file accurate enough for handoff and resume
- assign explicit, non-overlapping file ownership to each sub-agent when working in parallel
- keep the approved branch/worktree and writable boundary visible in the implementation plan or active plan summary during implementation

Never:

- skip planning when a plan is needed
- enter implementation without plan approval
- write outside the approved writable boundary without explicit user approval
- treat verification as optional when real risk exists
- present unreviewed code as done
- auto-promote task knowledge into `project/`
- allow sub-agents to share file scope or write outside their designated sub-task assignments
