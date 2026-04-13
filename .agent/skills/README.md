# Skills Namespace

`skills/` stores focused procedural guidance that agents load only when a task or workflow needs it.

Skills are not a general documentation dump. They should be small, operational, and safe to hot-load into an active agent session.

Use a skill for:

- repeatable procedures
- focused operating modes
- reusable domain guidance
- tool or environment procedures
- narrow guidance that should not stay in context forever

Do not use a skill for:

- durable project truth
- broad architecture documentation
- large multi-role protocols
- task-local notes

Current core skills:

- `init` starts a runtime session and loads the framework contract
- `code-review` guides mandatory self-review
- `closeout` guides task summary, promotion review, and session cleanup

Keep skill instructions direct. If a procedure needs multiple artifacts, roles, or rounds, use a playbook instead.
