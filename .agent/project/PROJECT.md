# Project Overview
<!-- VERSION: 1.0 | STATUS: template -->

## Purpose

Lean project constitution.

## Template Mode

If this file still reads like a template, make filling it a top priority before deep task work.

Expected behavior:

- proactively tell the user that `PROJECT.md` should be defined together
- if this is an existing project and the agent already has enough context, offer to draft the file from current project knowledge for the user to confirm or correct
- if the project is still unclear, guide the user through defining it instead of silently continuing with a weak project constitution

This file should capture:

- project identity
- what the project actually is
- current scope or current mode
- engineering conventions
- architecture invariants
- critical constraints
- language, framework, and tooling expectations

This file should not become a general system encyclopedia.
This file should describe the project itself, not the mechanics of external tools, frameworks, integrations, or operating layers around it unless they create actual project-level invariants.

## Suggested Sections

### Identity
- project name
- codebase/module names
- primary stack

### What Is This Project
- short product or system description
- what problem it solves
- what kind of thing it is

### Current Scope
- current release phase, mode, or immediate scope

### Conventions
- coding rules
- ownership rules
- testing expectations
- deployment or environment assumptions

### Invariants
- non-negotiable architecture rules
- authority boundaries
- prohibited patterns

### Engineering Philosophy
- quality bar
- maintainability expectations
- cleanup or migration philosophy if relevant

## Anti-Patterns

- do not put task plans here
- do not turn this into a changelog
- do not document workflow mechanics here unless they are real project rules
- do not document external tool usage here unless it creates a true project constraint
