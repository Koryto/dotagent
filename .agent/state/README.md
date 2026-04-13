# State Namespace

`state/` stores runtime state for active and past agent sessions.

Use this namespace for:

- per-session control files
- session history
- session lifecycle artifacts

Core files:

- `session_state_template.md` is the template used to create live session files
- `session_log.md` records completed session summaries
- `sessions/` contains active per-session state files
- `sessions/archive/` contains archived session state files

Live session files are created or claimed during `dotagent-init`.

Do not invent session files manually unless the normal init path is unavailable and the user explicitly accepts that fallback.

State files are operational control files. Keep them concise, current, and focused on resume/handoff needs.
