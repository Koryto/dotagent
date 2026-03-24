---
name: "init"
description: "Initialize a dotagent working session from within a runtime. Use as the native runtime entrypoint when the project is already initialized and the agent needs to start from the framework correctly."
---

# Init

Start a `dotagent` session from within a supported runtime.

This skill is the framework entrypoint. Do not guess your own initialization flow.

## Load Manifest

Load the framework in this exact order.

### HOT

Load these files at session start. They define the session control plane.

1. `.agent/state/session_state.md`
2. `.agent/project/PROJECT.md`
3. `.agent/workflows/{workflow}.md`

`{workflow}` comes from `session_state.md`. If no workflow is specified, use `standard`.

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

1. Read `.agent/state/session_state.md`.
2. If `status == IDLE`, prepare for a new task.
3. If `status == IN_PROGRESS`, resume from `handoff_instructions` and `resume_files`.
4. Read `.agent/project/PROJECT.md`.
5. Read `.agent/workflows/{workflow}.md`.
6. Read `.agent/project/project_progress.md`, then release it from active context unless it remains immediately useful.
7. If resuming, load the files listed in `resume_files`.
8. If resuming, load task artifacts under `.agent/tasks/` that match the active task.
9. Only after the initialization sequence is complete, acknowledge ready state to the user and continue.

## Responsibilities

- start from the framework, not from ad hoc repo scanning
- keep the hot set stable while exploring the codebase
- follow the active workflow instead of improvising the phase order
- treat `specs/`, `systems/`, `tasks/`, and `project/` as different truth types
- keep cold namespaces unloaded until the task actually needs them

## Rules

Always:

- use this skill as the source of truth for session startup
- read `session_state.md` before any planning or implementation
- reload the hot set if heavy scanning pushes it out of active context
- keep the user on the active workflow unless the user explicitly changes it

Never:

- start by wandering through the repo
- invent a different load order
- hot-load `tasks/`, `skills/`, `playbooks/`, `specs/`, or `systems/` without a task-driven reason
- treat task-local notes as durable project or system truth
