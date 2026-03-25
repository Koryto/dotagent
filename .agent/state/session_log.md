# Session Log
<!-- VERSION: 2.0 | STATUS: template -->

## Purpose

Append-only session history.

Cold loaded. Use only when historical session context is needed.

This file is not the primary source of project truth. It exists to preserve resumable session context, especially around a subsystem, task line, or architectural area.

## Format

- headline format: `Session N (YYYY-MM-DD) - <session_id>`
- one section per session
- append only
- concise bullets, high signal only

If the agent knows its session ID, include it.
If the agent does not know its session ID, ask the user before writing the entry.

## Suggested Content Per Session

- what was completed
- major findings or regressions discovered
- key decisions made in the session
- important files or task artifacts created
- branch or environment notes when materially relevant
- why this session would be worth resuming later

## Sessions

### Session N (YYYY-MM-DD) - <session_id>
- Summary of the session.
- Major work completed.
- Important task artifact:
  - `tasks/{task_name}/pr_summary.md`

Key decisions (session N):
- Decision one.
- Decision two.
