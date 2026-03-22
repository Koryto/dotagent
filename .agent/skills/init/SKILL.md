---
name: init
description: Initialize a dotagent working session from within a runtime. Use as the native runtime entrypoint when the project is already initialized and the agent needs to start from the framework correctly.
---

# Init

Use this skill to start a `dotagent` session from within a supported runtime.

This skill is the runtime-facing entrypoint.

## Purpose

Start the session through the framework correctly without guessing what to load first.

## Read Order

1. `.agent/BOOTSTRAP.md`
2. follow the manifest and initialization sequence defined there

## Responsibilities

- start from the framework entrypoint instead of ad hoc project browsing
- respect the bootstrap load manifest
- follow the active workflow from session state
- avoid loading extra namespaces until the bootstrap manifest requires them

## Rules

Always:

- begin from `.agent/BOOTSTRAP.md`
- follow the manifest order defined there
- treat this skill as the runtime wrapper around the framework bootstrap path

Never:

- skip `BOOTSTRAP.md`
- replace the bootstrap manifest with your own guessed initialization order
