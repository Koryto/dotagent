# dotagent

`dotagent` is a framework for running AI-assisted software development with explicit gates, durable project memory, and human ownership of the codebase.

It is opinionated on purpose. The goal is not unrestricted autonomous coding. The goal is to keep serious codebases understandable, resumable, and reviewable while using agents aggressively.

[![npm version](https://img.shields.io/npm/v/%40koryto%2Fdotagent)](https://www.npmjs.com/package/@koryto/dotagent)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.20.1-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/npm/l/%40koryto%2Fdotagent)](./LICENSE)

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

- Codex: `$dotagent-init session_id=<runtime_session_id>`
- Claude Code: `/dotagent:init session_id=<runtime_session_id>`

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

## Multi-Agent

`dotagent` now supports parallel top-level agent work against the same project.

The multi-agent model stays human-governed:

- each runtime session claims its own session state file under `state/sessions/`
- `dotagent claim-state` provides deterministic session claim/create behavior
- implementation work must use an approved branch/worktree and an approved writable boundary
- the default implementation worktree location is `.worktrees/<session_id>` unless the user explicitly approves a different path
- stale session files can be archived or cleaned up with dedicated CLI commands

## Playbooks

`playbooks/` is an optional namespace for operational packages that are too large, stateful, or role-dependent to fit cleanly into a single skill.

Current bundled playbooks:

- `deep-co-planning` - turn a human-led HLD into one or more implementation-driving specs through structured reviewer pressure
- `deep-code-review` - run a structured multi-agent review loop for large or high-risk changes

See [.agent/playbooks/README.md](./.agent/playbooks/README.md) for the current conventions.
