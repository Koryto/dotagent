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

- `resume_files` should include the implementation plan when one exists, and any spec or system files required to resume safely.
- Keep task-local detail in task artifacts, not in this file.
