# Tasks Namespace

`tasks/` stores task-local working memory.

Use this namespace for:

- implementation plans
- task-specific design notes
- self-review artifacts
- verification notes
- summaries

Recommended naming:

- `{task_name}/ip.md`
- `{task_name}/review.md`
- `{task_name}/verification.md`
- `{task_name}/pr_summary.md`

Example:

- `combat_ability/ip.md`
- `combat_ability/pr_summary.md`

When an implementation plan exists under the `standard` workflow, record:

- approved branch/worktree for implementation
- approved writable boundary for implementation

Do not treat task files as durable system truth.
