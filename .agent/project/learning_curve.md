# Learning Curve
<!-- VERSION: 1.0 | STATUS: template -->

## Purpose

Instruction-depth calibration for the `learning` workflow.

Load this file only when the active workflow is `learning`.

This file helps the agent decide how much explanation to provide for each concept or subsystem.

## Levels

- `new`: explain fully
- `learning`: explain the reasoning, keep patterns concise
- `comfortable`: concise steps only
- `fluent`: agent can implement directly unless the user wants instruction

## Suggested Structure

Use any structure that fits the project, but keep it easy to scan.

Recommended columns:

| Concept | Level | Notes |
|---------|-------|-------|
| Example concept | learning | Short note about current familiarity |

## Update Rule

Only update this file with user confirmation.

