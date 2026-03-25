# Session State
<!-- SESSION_VERSION: 2.0 | STATUS: template -->

Keep this file small. This is the session control register, not a narrative log.

Update it when:

- a task starts
- the active phase changes
- the session pauses
- the task closes out

## STATE

```yaml
status: IDLE
workflow: standard
phase: none
task_name: none
description: ""
last_updated: YYYY-MM-DD
resume_files: []
blockers: []
```

## HANDOFF_INSTRUCTIONS

- No active task.

## NOTES

- Keep the state block accurate for handoff, resume, and phase visibility.
- Use `standard` as the default workflow unless the user explicitly selects another one.
- When a task becomes active:
  - set `status` to `IN_PROGRESS`
  - set `workflow`
  - set the current `phase`
  - set `task_name`
  - set `description`
  - set `resume_files` to the files needed to continue safely
- When the session is paused:
  - keep `status` as `IN_PROGRESS`
  - update `resume_files`
  - update `blockers` if applicable
  - leave clear handoff instructions
- When the task is complete:
  - return the session to `IDLE`
  - clear task-specific state
- `resume_files` should include the implementation plan when one exists, and any spec or system files required to resume safely.
- Keep task-local detail in task artifacts, not in this file.
