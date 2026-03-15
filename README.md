# dotagent

`dotagent` is a template for running AI-assisted software development with explicit gates, durable project memory, and human ownership of the codebase.

It is opinionated on purpose. The goal is not "vibe coding with nicer prompts." The goal is to keep serious codebases understandable, resumable, and extendable while using agents aggressively.

## Why This Exists

Most agent wrappers optimize for speed and autonomy.

This framework optimizes for:

- controlled execution
- durable project memory
- resumable multi-session work
- architecture awareness
- production-grade review discipline

The assumption is simple:

Agents can write code quickly, but humans still need to own the system. If the structure around the agent is weak, the codebase degrades faster than it did under normal human-paced development.

## Core Model

The template standardizes project knowledge into four namespaces:

- `project/` - project constitution and standing rules
- `specs/` - intended design and architecture
- `systems/` - implemented reality
- `tasks/` - task-local working memory

Supporting namespaces:

- `state/` - current session state and session history
- `workflows/` - gated execution workflows
- `skills/` - on-demand procedural guidance

## Philosophy

- Keep hot-loaded files small and stable.
- Separate intended design from implemented reality.
- Treat task artifacts as local working memory, not durable truth.
- Require review before calling work done.
- Keep the human in control of architectural decisions and risky execution.

## What This Is Not

- not a wrapper for unrestricted autonomous coding
- not a prompt pack for "vibe coding"
- not a replacement for engineering judgment
- not a guarantee of quality if the framework's gates are ignored
- not a rigid standard every project must follow exactly

## Included Template

```text
.agent/
|-- BOOTSTRAP.md
|-- ONBOARD.md
|-- project/
|   |-- PROJECT.md
|   |-- learning_curve.md
|   |-- project_progress.md
|   `-- project_decision_log.md
|-- state/
|   |-- session_state.md
|   `-- session_log.md
|-- skills/
|   |-- README.md
|   `-- code-review/
|       `-- SKILL.md
|-- workflows/
|   |-- standard.md
|   `-- learning.md
|-- specs/
|   |-- README.md
|   `-- architecture/
|       `-- README.md
|-- systems/
|   `-- README.md
`-- tasks/
    `-- README.md
```

## Workflows

### `standard`

Default implementation workflow:

1. Planning
2. Implementation
3. Review
4. Verification
5. Summary

### `learning`

Used when the user is ramping up on an unfamiliar stack, tool, or subsystem.

It reads `project/learning_curve.md` to calibrate explanation depth and decide whether the user or the agent should implement each step.

## Skills

Skills are intentionally loaded on demand, not kept in hot context.

The exact skill set is expected to evolve over time.

## Session Model

- `state/session_state.md` tracks whether the current session is idle or in progress.
- `state/session_log.md` is append-only historical session context.
- `BOOTSTRAP.md` is the single session entrypoint.
- `ONBOARD.md` is the one-time setup entrypoint for projects that have not initialized the framework yet.

This lets the user resume from the current task or from a prior session that built useful context in a subsystem.

## How To Use

1. Copy the `.agent/` directory into a project.
2. Fill in `project/PROJECT.md`.
3. Set the initial state in `state/session_state.md`.
4. Start sessions by reading `BOOTSTRAP.md`.
5. Keep durable system knowledge in `systems/`, not in task artifacts.
6. Use `specs/` only when design intent needs to be defined or clarified.
7. Use `tasks/` for plans, reviews, verification notes, and summaries.

## Notes

- This template is not enforced by code. It is a working contract between the user and the agent.
- Projects are free to extend or shrink it.
- If a team removes important files, the framework does not break mechanically. It just becomes less effective.

## Future Phases

### Phase 1: Shared Engineering Operating System

Transition from solo disciplined use to a partially shared engineering operating system.

Likely work in this phase:

- move toward a model where only local execution state stays unshared
- keep `state/` and `tasks/` local by default
- evaluate sharing `project/`, `specs/`, `systems/`, `workflows/`, and `skills/`
- tighten `ONBOARD.md` with explicit install and update commands
- add assistant-specific command adapters for flows like onboarding, bootstrap, and review while keeping the framework itself agent-agnostic

### Phase 2: Agent Concurrency

Extend the framework from a single-core session model to a multi-process model for large projects with multiple unrelated tasks in flight.

Likely work in this phase:

- define a task pool the framework can expose to a manager agent
- define the information the manager needs to allocate work to worker agents
- create isolated workspaces or work branches per worker to avoid collisions
- establish merge, review, and conflict-handling rules between concurrent workers
- keep the concurrency model subordinate to the same memory, review, and verification standards as the single-agent flow
