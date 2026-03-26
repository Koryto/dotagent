# dotagent

`dotagent` is a framework for running AI-assisted software development with explicit gates, durable project memory, and human ownership of the codebase.

It is opinionated on purpose. The goal is not unrestricted autonomous coding. The goal is to keep serious codebases understandable, resumable, and reviewable while using agents aggressively.

## Quickstart

Install the published CLI:

```bash
npm install -g @koryto/dotagent
```

Initialize the framework in your project.

Select the runtimes you actually want to support before copying the command:

```bash
dotagent init --runtimes <codex,claude,opencode,copilot>
dotagent doctor
```

Then start agent work through your runtime's native `dotagent-init` wrapper.

Examples:

- Codex: `$dotagent-init`
- Claude Code: `/dotagent:init`

## Why This Exists

Most agent wrappers optimize for speed and autonomy.

This framework optimizes for:

- controlled execution
- durable project memory
- resumable multi-session work
- architecture awareness
- production-grade review discipline

Agents can write code quickly, but humans still need to own the system. If the structure around the agent is weak, the codebase degrades faster than it did under normal human-paced development.

## Core Model

The framework standardizes project knowledge into four primary namespaces:

- `project/` - project constitution and standing rules
- `specs/` - intended design and architecture
- `systems/` - implemented reality
- `tasks/` - task-local working memory

Supporting namespaces:

- `state/` - current session state and session history
- `workflows/` - gated execution workflows
- `skills/` - on-demand procedural guidance
- `playbooks/` - optional multi-file operational packages

## Philosophy

- keep hot-loaded files small and stable
- separate intended design from implemented reality
- treat task artifacts as local working memory, not durable truth
- require review before calling work done
- keep the human in control of architectural decisions and risky execution

## Workflows

### `standard`

Default implementation workflow:

1. Planning
2. Implementation
3. Review
4. Verification
5. Summary

### `patch`

Lightweight workflow for small, low-risk fixes:

1. Scope
2. Patch
3. Sanity
4. Summary

Use `standard` by default when the workflow is unspecified.

## Skills

Skills are loaded on demand, not kept in hot context by default.

## Playbooks

`playbooks/` is an optional namespace for operational packages that are too large, stateful, or role-dependent to fit cleanly into a single skill.

Current bundled playbooks:

- `deep-co-planning` - turn a human-led HLD into one or more implementation-driving specs through structured reviewer pressure
- `deep-code-review` - run a structured multi-agent review loop for large or high-risk changes

See [.agent/playbooks/README.md](./.agent/playbooks/README.md) for the current conventions.

## Session Model

- `state/session_state.md` tracks whether the current session is idle or in progress
- `state/session_log.md` is append-only historical session context
- `skills/init/SKILL.md` is the framework session entrypoint
- the CLI owns framework initialization and playbook runtime scaffolding

## How To Use

1. Initialize the framework with `dotagent init`.
2. Fill in `project/PROJECT.md`.
3. Start sessions through your runtime-native `dotagent-init` bridge, which loads `skills/init/SKILL.md`.
4. Keep durable system knowledge in `systems/`, not in task artifacts.
5. Use `specs/` only when design intent needs to be defined or clarified.
6. Use `tasks/` for plans, reviews, verification notes, and summaries.

## Notes

- The framework is not enforced by code alone. It is a working contract between the user and the agent.
- Projects are free to extend or shrink it.
- If a team removes important files, the framework does not break mechanically. It becomes less effective.
