# Workflows Namespace

`workflows/` stores task execution contracts.

A workflow defines:

- the phases of work
- the gates between phases
- what the agent must keep visible to the user
- when review, verification, and closeout happen

Bundled workflows:

- `standard` is the default workflow for substantial implementation work
- `patch` is a lighter workflow for small, low-risk fixes

Use `standard` when:

- the task needs planning
- the change affects multiple files or systems
- review and verification risk matter
- branch/worktree and writable-boundary approval are needed

Use `patch` when:

- the change is small
- scope is obvious
- risk is low
- a full implementation plan would add noise

Workflows are not suggestions. They are the active execution contract for the session. If the user wants to skip or change a workflow phase, that should be explicit.
