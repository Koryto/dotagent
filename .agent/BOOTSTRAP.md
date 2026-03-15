# Agent Framework Bootstrap
<!-- BOOTSTRAP_VERSION: 3.0 | STATUS: template -->

## PURPOSE

Single entry point for agent initialization. Read this file first at the start of every session.

---

## LOAD MANIFEST

Load files in this exact order. Do not load files outside this manifest unless they are needed for the current task.

### HOT - always load at session start
1. `state/session_state.md` - check whether the session is idle or in progress
2. `project/PROJECT.md` - load project identity, standing rules, and conventions
3. `workflows/{workflow}.md` - load only the workflow named in session state (default: `standard`)

### WARM - load at session start, then release
4. `project/project_progress.md` - orient on current roadmap and project phase

### COLD - load on demand only
5. `specs/` - intended design and architecture, only load files relevant to the current task
6. `systems/` - implemented reality, only load files relevant to the current task
7. `project/learning_curve.md` - only when `workflow == learning`
8. `project/project_decision_log.md` - only when a historical project-level decision matters
9. `state/session_log.md` - only when prior session history is needed
10. `tasks/` - only when resuming or when prior task artifacts are relevant
11. `skills/` - only when a workflow or task explicitly needs a skill

---

## INITIALIZATION SEQUENCE

1. Read `state/session_state.md`
   - If `status == IDLE`, prepare for a new task
   - If `status == IN_PROGRESS`, resume from `handoff_instructions` and load referenced files
2. Read `project/PROJECT.md`
3. Read `workflows/{workflow}.md`
4. Read `project/project_progress.md`, then release it from active context
5. If `workflow == learning`, read `project/learning_curve.md`
6. If resuming, load the files listed in `session_state.resume_files`
7. If resuming, load existing task artifacts in `tasks/` matching the active task name
8. Announce ready state to the user

---

## DIRECTORY STRUCTURE

```text
.agent/
|-- BOOTSTRAP.md
|-- project/
|   |-- PROJECT.md
|   |-- learning_curve.md
|   |-- project_progress.md
|   `-- project_decision_log.md
|-- state/
|   |-- session_state.md
|   `-- session_log.md
|-- skills/
|   `-- <skill_name>/SKILL.md
|-- workflows/
|   |-- standard.md
|   `-- learning.md
|-- specs/
|   |-- README.md
|   `-- architecture/
|-- systems/
|   `-- README.md
`-- tasks/
    `-- README.md
```

---

## NAMESPACE RULES

- `project/` holds standing rules and project-wide identity. Keep it lean.
- `specs/` holds intended design. Use it for HLDs, RFCs, and architecture docs.
- `systems/` holds implemented reality. Update it after task completion when a significant implemented system changed.
- `tasks/` holds task-local artifacts such as plans, reviews, verification notes, and summaries.
- `skills/` holds on-demand procedural guidance. Do not hot-load skills unless the task or workflow needs them.

---

## PROMOTION RULES

- Promote from `tasks/` to `systems/` only after the task is done, and only if the change materially altered an implemented system.
- Create or update `specs/` after scope is clarified and before detailed implementation planning when the task needs design intent captured.
- Do not automatically promote anything into `project/`. Project-level invariants require explicit user intent.

---

## RULES

Always:
- read `state/session_state.md` before starting work
- follow the active workflow
- keep `project/` lean
- treat `specs/` and `systems/` as separate namespaces with different truth types
- update `state/session_state.md` when ending mid-task

Never:
- start implementation without an approved plan when the active workflow requires one
- auto-promote task knowledge into `project/`
- treat `tasks/` as durable system truth
