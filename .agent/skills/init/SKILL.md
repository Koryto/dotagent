---
name: "init"
description: "Initialize a dotagent working session from within a runtime. Use as the native runtime entrypoint when the project is already initialized and the agent needs to start from the framework correctly."
invocation-args:
  session_id: required
  state_to_pickup: optional
---

# Init

Start a `dotagent` session from within a supported runtime.

This skill is the framework entrypoint. Do not guess your own initialization flow.

## Load Manifest

Load the framework in this exact order.

### HOT

Load these files at session start. They define the session control plane.

1. `.agent/state/sessions/state_<session_id>.md`
2. `.agent/project/PROJECT.md`
3. `.agent/workflows/{workflow}.md`

If the active session file does not exist yet, derive it from:

- `.agent/state/session_state_template.md`

`{workflow}` comes from the active session file. If no workflow is specified, use `standard`.

Treat `.agent/workflows/{workflow}.md` as the active execution contract, not just startup context.
Reload it before phase transitions, after long exploratory work, and whenever drift is possible.

### WARM

Load these once for orientation, then release them unless they stay relevant:

4. `.agent/project/project_progress.md`

### COLD

Load these only when the task explicitly needs them:

5. `.agent/specs/`
6. `.agent/systems/`
7. `.agent/playbooks/`
8. `.agent/project/project_decision_log.md`
9. `.agent/state/session_log.md`
10. `.agent/tasks/`
11. `.agent/skills/`

Do not cold-load entire namespaces preemptively. Load only the files needed for the current task.

## Initialization Sequence

1. Require `session_id` at runtime entry. If it is missing, ask the user immediately.
2. Resolve the active session file at `.agent/state/sessions/state_<session_id>.md`.
3. If `state_to_pickup` was supplied, treat it as the intended session file to adopt. Do not guess pickup targets implicitly.
4. If the active session file does not exist yet, use `.agent/state/session_state_template.md` as the source template for creating it with framework assistance.
5. Read the active session file.
6. If `status == IDLE`, prepare for a new task.
7. If `status == IN_PROGRESS`, resume from `handoff_instructions` and `resume_files`.
8. Read `.agent/project/PROJECT.md`.
9. Read `.agent/workflows/{workflow}.md`.
10. Read `.agent/project/project_progress.md`, then release it from active context unless it remains immediately useful.
11. If resuming, load the files listed in `resume_files`.
12. If resuming, load task artifacts under `.agent/tasks/` that match the active task.
13. If starting a new task or receiving a new task from the user, surface workflow selection explicitly. Keep `standard` as the default, offer `patch` when it may fit, and continue with `standard` if the user does not choose.
14. Only after the initialization sequence is complete, acknowledge ready state to the user and continue.

## Responsibilities

- start from the framework, not from ad hoc repo scanning
- keep the hot set stable while exploring the codebase
- follow the active workflow instead of improvising the phase order
- treat `standard` as the default workflow unless the user explicitly selects another one
- surface workflow selection explicitly when a new task is introduced
- treat `specs/`, `systems/`, `tasks/`, and `project/` as different truth types
- keep cold namespaces unloaded until the task actually needs them

## Rules

Always:

- use this skill as the source of truth for session startup
- require `session_id` before loading live session state
- read the active session file under `state/sessions/` before any planning or implementation
- reload the hot set if heavy scanning pushes it out of active context
- keep the user on the active workflow unless the user explicitly changes it
- prompt for workflow selection when a new task starts instead of assuming the user knows the available workflows

Never:

- start by wandering through the repo
- invent a different load order
- hot-load `tasks/`, `skills/`, `playbooks/`, `specs/`, or `systems/` without a task-driven reason
- treat task-local notes as durable project or system truth
- continue without an explicit session id from the user, or map one session id to another implicitly
