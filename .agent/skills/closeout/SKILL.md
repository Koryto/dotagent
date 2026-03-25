---
name: "closeout"
description: "Close a task cleanly at the end of the standard workflow. Use for summary, promotion decisions, project progress updates, session state updates, and session log updates."
---

# Closeout

Use this skill during the Summary phase of the standard workflow.

The goal is to leave the framework in a clean, resumable state with durable truth updated only where it belongs.

## Closeout Order

Handle closeout in this order:

1. review promotion targets
2. write the task summary
3. update project progress if durable progress changed
4. update session state
5. update the session log if the session is ending

Do not update logs first and then decide what the task actually changed.

## Promotion Review

Decide what remains task-local and what becomes durable framework truth.

Promote to `systems/` when:

- implemented reality materially changed
- a future engineer or agent would need this knowledge to work safely
- the knowledge describes the current system, not just the task process

Promote to `specs/` only when:

- intended design changed
- new design intent was created during the task

Record a project-level decision only when the task created or changed a real standing rule, invariant, or strategic choice.

Use:

- `project/project_decision_log.md`

Do not promote:

- temporary scaffolding
- routine cleanup
- implementation narration
- task-local experiments
- operator notes that are not project-wide truth

Do not promote anything into `project/` by default. `project/` is constitutional, not a catch-all.

## Task Summary

Write:

- `tasks/{task_name}_pr_summary.md`

The summary should capture:

- task scope
- main outcomes
- important files or artifacts changed
- verification performed
- remaining limits, risks, or follow-ups

Keep it useful for a future human or agent who needs to understand what this task accomplished without replaying the session.

## Progress Update

Update:

- `project/project_progress.md`

Only record durable progress:

- completed milestones
- new active phase
- meaningful next priorities

Do not turn `project_progress.md` into a session diary.

## Session State Update

Update:

- `state/session_state.md`

If the task is complete:

- set the session to `IDLE`
- set `workflow` to `standard`
- set `phase` to `none`
- set `task_name` to `none`
- clear `description`
- clear `resume_files`
- clear `blockers`
- clear stale handoff instructions
- leave a short next-task pointer only if it is genuinely useful

If the task is not complete:

- keep the session in progress
- leave precise handoff instructions
- name the files a future session should reload

Session state must tell the next agent exactly whether it is resuming work or starting fresh.

## Session Log Update

If the session is ending, update:

- `state/session_log.md`

Include the session ID when known. If it is required and unknown, ask the user.

Log only high-signal resumable context:

- what was completed
- what remains open
- important artifacts
- key decisions
- why resuming this session would matter

Do not dump narrative chronology into the session log.

## Output Contract

Before leaving Summary, confirm the status of:

- promotion review
- task summary
- project progress
- session state
- session log

If an item was intentionally skipped, say so explicitly.

## Rules

Always:

- prefer durable, high-signal updates over narrative history
- keep each namespace aligned to its truth type
- leave the next session with a clear resume path
- keep project-wide files lean

Never:

- promote task-local notes into `project/` by default
- leave session state ambiguous
- log noise just because the file exists
- confuse implemented reality, intended design, and project constitution

