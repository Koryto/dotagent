# Playbooks
<!-- VERSION: 0.1 | STATUS: experimental -->

## Purpose

`playbooks/` is an experimental namespace for reusable operational packages that sit above individual skills.

This namespace is in active development.

Its structure, conventions, and package contract are not final.

## Why This Exists

Some problems are too large, stateful, or role-dependent to be handled cleanly by:

- one workflow step
- one skill
- one narrow procedural document

Playbooks exist for those cases.

A playbook is intended to package:

- an operational procedure
- the supporting standards and references it needs
- any role-specific entrypoints
- any runtime templates or scaffolds

The goal is to make complex procedures reusable without bloating `dotagent` core.

## What A Playbook Is

A playbook is a multi-file operational system.

It may define:

- roles
- phases or rounds
- artifacts
- templates
- runtime-specific entrypoints
- supporting standards

Not every playbook will look the same.

The framework should not assume one universal playbook lifecycle, role model, or artifact model.

## What A Playbook Is Not

- not a core framework namespace that is always loaded
- not a replacement for `skills/`
- not a required layer for projects that do not need it
- not a rigid plugin contract that every package must follow exactly

## Skills vs Playbooks

Use a skill when:

- one file is enough
- the task is narrow and repetitive
- one procedural interface is sufficient

Use a playbook when:

- multiple files are required
- the procedure has meaningful state or sequencing
- multiple roles or participants may exist
- the procedure needs templates, runtime scaffolding, or supporting standards

## Namespace Conventions

Playbook packages should use a shared namespace language.

Current intended conventions:

- package naming: `the-<playbook-name>`
- each playbook defines its own role language
- each playbook defines its own artifact model

These conventions belong to the playbook layer only.

They should not leak into `dotagent` core files.

## Design Direction

This namespace should stay:

- optional
- package-oriented
- general enough for different kinds of operational systems

It should be able to host very different playbooks over time, for example:

- extreme code review
- deep co-planning
- release orchestration
- migration flows
- multi-phase implementation procedures
- tooling or MCP-heavy operating patterns

The point is not to force them into one mold.

The point is to give the framework a home for complex reusable procedures that are too large for a skill and too specific for the core.
