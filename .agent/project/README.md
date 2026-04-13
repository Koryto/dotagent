# Project Namespace

`project/` stores project-level context that should remain true across tasks and sessions.

Use this namespace for durable operating knowledge that every serious agent session may need.

Core files:

- `PROJECT.md` defines the project identity, goals, conventions, and standing rules
- `project_progress.md` tracks major milestones, current phase, and upcoming direction
- `project_decision_log.md` records explicit project-level decisions that should outlive a task

Keep this namespace small and deliberate.

Do not use `project/` for:

- task implementation notes
- temporary status updates
- detailed architecture documents
- session logs

Those belong in `tasks/`, `specs/`, `systems/`, or `state/`.

If `PROJECT.md` still reads like a template after initialization, treat filling it as an early setup task. The framework works best when the agent can load stable project context before doing deep work.
