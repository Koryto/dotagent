# Tasks Namespace

`tasks/` stores task-local working memory.

Use this namespace for artifacts that help complete a specific task but should not automatically become durable project truth.

Common task artifacts:

- `tasks/<task_name>/ip.md` for implementation plans
- `tasks/<task_name>/review.md` for self-review notes
- `tasks/<task_name>/verification.md` for verification results and limitations
- `tasks/<task_name>/pr_summary.md` for final summaries

Under the `standard` workflow, an implementation plan should record:

- scope
- affected files or systems
- approved branch/worktree
- approved writable boundary
- implementation steps
- risks
- verification approach

Task artifacts may be promoted during closeout:

- durable implemented reality goes to `systems/`
- durable intended design goes to `specs/`
- project-wide rules or decisions go to `project/`

Do not treat `tasks/` as permanent project memory by default. It is the workspace for getting the task done.
