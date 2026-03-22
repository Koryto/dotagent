---
name: "closeout"
description: "Close a task cleanly at the end of the standard workflow. Use for summary, promotion decisions, project progress updates, session state updates, and session log updates."
---

# Closeout

Use this skill during the Summary phase of the standard workflow.

The goal is to finish work cleanly without leaving project state inconsistent.

## Responsibilities

### 1. Promotion Review

Decide whether task knowledge stays local or should be promoted.

- update `systems/` when implemented reality changed significantly
- do not promote anything into `project/` unless the user explicitly wants a project-level invariant recorded
- do not treat task artifacts as durable truth

If a project-specific runbook or operator guide exists, do not confuse it with `project/` constitutional content.

### 2. Project Decision Review

If the task established a real project-level decision, record it in:

- `project/project_decision_log.md`

Do not log routine cleanup, temporary scaffolding, or documentation churn as project decisions.

### 3. Task Summary

Write:

- `tasks/{task_name}_pr_summary.md`

The summary should state:

- scope
- main outcomes
- important files or artifacts created/changed
- key notes or remaining limits

### 4. Progress Update

Update:

- `project/project_progress.md`

Only record durable progress, not session narrative.

### 5. Session State Update

Update:

- `state/session_state.md`

If the task is complete:

- set the session back to `IDLE`
- clear active task references
- leave handoff notes for the likely next task if useful

If the task is not complete:

- keep the session in progress
- leave clear handoff instructions

### 6. Session Log Update

If the session is ending, update:

- `state/session_log.md`

Include the session ID when the agent knows it.
If the agent does not know the session ID, ask the user.

The session log entry should contain only high-signal context:

- what was completed
- important task artifacts
- key decisions made in the session
- why the session would be worth resuming later

## Output Checklist

Before leaving Summary, confirm that all applicable items were handled:

- systems promotion reviewed
- project decision log reviewed
- task summary written
- project progress updated
- session state updated
- session log updated or consciously skipped

## Rules

Always:

- prefer durable, high-signal updates over narrative history
- keep project-wide logs clean
- distinguish between constitutional project truth and operational project guidance

Never:

- promote task-local notes into `project/` by default
- leave the session state ambiguous
- write noisy session log entries that add no resumable value

