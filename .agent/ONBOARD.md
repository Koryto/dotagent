# Onboard
<!-- VERSION: 1.0 | STATUS: template -->

## Purpose

One-time setup entrypoint for projects that want to initialize the agent framework.

Use this file only when `.agent/BOOTSTRAP.md` does not exist yet.

If both `ONBOARD.md` and `BOOTSTRAP.md` exist, `BOOTSTRAP.md` wins.

## Goal

Initialize the full `dotagent` template inside the selected project directory without auto-filling project-specific content.

The first setup should stay user-led.

## Template Source

- repo: `https://github.com/Koryto/dotagent`
- ref: `master`
- path: `.agent/`

This source should be used for initial scaffold installation and future framework updates.

## Onboarding Rules

1. Scaffold the full `.agent/` template into the target project.
2. Do not auto-fill project-specific information.
3. Do not overwrite an existing `.agent/` directory without explicit user approval.
4. Ensure `.agent/` is ignored by git:
   - if `.gitignore` exists, add `.agent/` if missing
   - if `.gitignore` does not exist, create it with `.agent/`
5. After scaffolding, stop and ask the user to populate:
   - `project/PROJECT.md`
   - `state/session_state.md`
   - any other project-specific files they want to seed manually

## After Onboarding

Once the template exists and the user has populated the initial project files, future sessions should start from `.agent/BOOTSTRAP.md`.
