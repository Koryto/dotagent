# Sessions

This directory holds the live per-session state files.

Naming convention:

- `state_<session_id>.md`

Examples:

- `state_019cf1cb-41ad-72d2-943c-b8a83e24641d.md`

Rules:

- each live agent session owns exactly one active file here
- the active file is derived from `state/session_state_template.md`
- session IDs are used as-is; do not alias or normalize them
- archive and cleanup are CLI responsibilities, not agent responsibilities
- use `dotagent archive-sessions <days>` to move old session files into `archive/`
- use `dotagent cleanup-sessions <days>` to permanently delete old session files by age
