# Patch Workflow
<!-- WORKFLOW_VERSION: 1.0 | STATUS: active | TYPE: lightweight -->

## Purpose

Lightweight workflow for small, low-risk changes where the full `standard` workflow would add unnecessary ceremony.

Use this workflow only when the task is:

- narrow in scope
- local in impact
- unlikely to need new design intent
- unlikely to need substantial task artifacts

If that stops being true, switch to `standard`.

## Workflow Contract

The agent must:

- announce the active phase when entering it
- make the current gate visible to the user
- update the active session file under `state/sessions/` at task start, phase transitions, pause, and closeout
- switch to `standard` if scope, risk, or uncertainty grows beyond a lightweight patch

The user must:

- confirm or accept the lightweight patch path when the task shape is unclear
- explicitly accept remaining risk if sanity verification cannot fully close it

## Phase 1: Scope

Goal: confirm that `patch` is appropriate and define the change.

Agent actions:

1. Announce entry into Scope.
2. Update the active session file for an active task in `workflow: patch`, `phase: scope`.
3. Confirm the task is still a good fit for `patch`.
4. Give a concise inline plan in chat:
   - intended change
   - likely files
   - sanity check path

Gate: patch path is appropriate

If the task is broad, risky, architectural, or likely to need substantial artifacts, switch to `standard` before implementation.

## Phase 2: Patch

Goal: implement the smallest justified change.

Agent actions:

1. Announce entry into Patch.
2. Update the active session file to `phase: patch`.
3. Make the minimal change that solves the task cleanly.
4. Avoid speculative cleanup unless it is directly justified by the patch.
5. Keep `resume_files` current if the task pauses or the active working set changes materially.
6. If the task grows in risk or scope, stop and move to `standard`.

Gate: change is ready for sanity review

## Phase 3: Sanity

Goal: perform a lightweight review and verification pass proportional to the patch.

Agent actions:

1. Announce entry into Sanity.
2. Update the active session file to `phase: sanity`.
3. Review the patch at a lightweight level:
   - obvious correctness
   - obvious regression risk
   - obvious ownership or style breakage
4. Run the smallest useful verification path.
5. If the patch exposes non-trivial findings or risk:
   - fix and repeat Sanity
   - or switch to `standard` if the task is no longer lightweight
6. If sanity verification cannot fully close the risk:
   - say so explicitly
   - let the user accept the remaining risk

Gate: sanity pass is clean, or the user accepts the remaining risk

## Phase 4: Summary

Goal: close the patch without unnecessary artifact overhead.

Agent actions:

1. Announce entry into Summary.
2. Update the active session file to `phase: summary`.
3. Summarize in chat:
   - what changed
   - what was verified
   - any remaining limitation or risk
4. If the task is complete, return the session to `IDLE`, set `workflow` to `standard`, set `phase` to `none`, set `task_name` to `none`, clear `description`, clear `resume_files`, clear `blockers`, and clear stale handoff instructions.
5. Only write task artifacts when they are actually useful.

Gate: patch closeout is complete

## Reload Rules

Reload the active session file under `state/sessions/` and the active workflow:

- before every phase transition
- after broad exploratory work
- whenever drift is possible

## Rules

Always:

- prefer `standard` when in doubt
- keep `patch` small, local, and explicit
- escalate to `standard` as soon as the lightweight path stops fitting
- make the user aware that `patch` is the lighter workflow, not the default

Never:

- use `patch` for architectural work
- use `patch` for broad refactors
- use `patch` to skip review or verification entirely
- keep forcing a lightweight workflow after the task has obviously outgrown it
