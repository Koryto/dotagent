# Session Archive

This directory holds archived session state files moved out of the active `sessions/` directory.

Archived files keep the same naming convention:

- `state_<session_id>.md`

Agents should not archive or delete session files manually unless the user explicitly asks.
Archive and cleanup are CLI responsibilities.
Use `dotagent archive-sessions <days>` to populate this directory.
Use `dotagent cleanup-sessions <days>` to delete old archived session files.
