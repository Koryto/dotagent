# Session State Template
<!-- SESSION_VERSION: 3.0 | STATUS: template -->

<!-- TEMPLATE_HEADER_START -->
Keep this file small. This is the template for live per-session control files, not a narrative log.

Live session files belong under:

- `state/sessions/state_<session_id>.md`

Do not treat this template as the active session register.
<!-- TEMPLATE_HEADER_END -->

## STATE

```yaml
owned_by: <session_id>
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

<!-- TEMPLATE_NOTES_START -->
- Copy this template into `state/sessions/state_<session_id>.md` when creating a new live session file.
<!-- TEMPLATE_NOTES_END -->
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
  - set `workflow` to `standard`
  - set `phase` to `none`
  - set `task_name` to `none`
  - clear `description`
  - clear `resume_files`
  - clear `blockers`
  - clear stale handoff instructions unless a short next-task pointer is genuinely useful
- `resume_files` should include the implementation plan when one exists, and any spec or system files required to resume safely.
- Keep task-local detail in task artifacts, not in live session files.
