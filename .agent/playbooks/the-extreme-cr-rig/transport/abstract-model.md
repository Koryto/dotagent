# Abstract Transport Model
<!-- VERSION: 0.1 | STATUS: experimental -->

## Purpose

Define how humans and agents interact during a rig round without coupling the playbook to one specific implementation surface.

## Principle

Transport is not the engine.

The transport layer exists to move review artifacts between actors while preserving:

- visibility
- control
- round state
- low-noise synthesis

## Communication Topology

### Human

The human can:

- instruct Stinson
- provide context to the rig
- request another review round
- decide merge criteria and loop termination

### Stinson

Stinson is the primary operational interface.

Stinson should:

- ingest Wingman outputs
- communicate synthesized state to the human
- request clarification when disputed findings need human judgment
- produce round outcomes

### Wingmen

Wingmen should primarily communicate through structured outputs, not open-ended discussion.

Their main responsibility is to produce findings that Stinson can ingest and normalize.

## Default Communication Rules

- Wingmen review independently
- Wingmen do not need to coordinate directly with one another
- Stinson is the central synthesis point
- the human should mostly interact with Stinson at round-results and final-verdict points
- direct Wingman-to-Wingman discussion should be minimized

## Required Transport Outcomes

The transport layer must allow:

- round start with shared context
- Wingman submission of findings
- Wingman access to prior Stinson feedback between rounds
- Stinson publication of reviewer-facing carry-forward feedback
- Stinson publication of one human-facing round-results artifact
- human approval or dispute of the round results
- batch-by-batch fix and verification updates
- explicit round verdict

## Implementations

Current implementation:

- `filesystem-transport.md`
