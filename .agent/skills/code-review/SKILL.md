---
name: code-review
description: Review code changes with production-grade rigor. Use for mandatory self-review before presenting implementation as complete, or when the user explicitly asks for a review. Focus on findings first: correctness, regressions, scale, architecture, best practices, extendability, and production readiness.
---

# Code Review

Review the code as if it will become part of a long-lived production codebase.

The objective is not to be agreeable. The objective is to surface real risks early, while they are still cheap to fix.

## When To Use

- mandatory self-review after implementation and before verification closeout
- any time the user asks for a review
- any time the task changes non-trivial code paths, system boundaries, or production behavior

## Review Standards

### 1. Correctness and Regression Risk

- look for logic bugs
- look for broken invariants
- look for missing edge-case handling
- look for behavior drift from the plan or intended design
- assume regressions are more likely in state transitions, lifecycle paths, concurrency, and partial-failure scenarios

### 2. Scale

Scale is always a top-level concern.

- reject designs that do not scale to the expected workload
- look for avoidable N+1 patterns, repeated expensive scans, hot-path allocations, chatty network/database behavior, poor caching boundaries, and unnecessary serialization/deserialization
- look for designs that are only acceptable at current scale but will fail under realistic growth
- if the scale assumptions are unclear, call that out explicitly

### 3. Industry Standards and Best Practices

- prefer established, defensible patterns over clever local shortcuts
- check whether the code aligns with the language, framework, and platform's normal production patterns
- if unsure about a best-practice claim, verify against primary sources or official documentation before asserting it

### 4. Extendability and Maintainability

- review whether the code keeps the codebase easy to extend
- flag hidden coupling, unclear ownership, poor abstraction boundaries, magic behavior, and ad hoc one-off logic
- check whether the code documents non-trivial behavior where needed
- also flag over-documentation when it obscures rather than clarifies
- the goal is a codebase future agents and humans can modify safely without guessing intent

### 5. Production-Grade Rigor

- do not waive low-severity issues just because the code "works"
- a skipped nit today is often future technical debt with compound cost
- flag sloppy fallback logic, partial implementations, weak cleanup, poor failure handling, and anything that would make future work harder
- prefer clean ownership and explicit behavior over convenience hacks

### 6. Architecture and Ownership

- check whether the change violates project invariants
- check whether responsibilities are in the right layer
- flag mixed authority, duplicate ownership, compatibility hacks that look permanent, and patterns that erode the architecture over time

### 7. Verification and Documentation Gaps

- check whether the change was verified in a way that matches its risk
- flag weak manual verification, or unverified critical paths
- flag missing updates to `systems/` or `specs/` when the task clearly changed durable knowledge

## Output Contract

The output must be findings-first.

### If Findings Exist

List findings ordered by severity.

Each finding should include:

- severity
- concise title
- why it matters
- file reference(s)
- recommended fix direction

Use this shape:

```md
1. High - Description of the issue
   Why it matters: ...
   File: /absolute/path/file.ext:line
   Fix direction: ...
```

### If No Findings Exist

State explicitly:

`No findings.`

Then list any residual risk or verification gaps if they still exist.

## Severity Guidance

- `High`: likely bug, regression, non-scalable design, broken invariant, or production risk that should be fixed before acceptance
- `Medium`: important weakness that should usually be fixed before acceptance unless consciously traded off
- `Low`: quality issue or debt item that is not immediately blocking but should still be called out

## Review Method

1. Understand the intended change.
2. Read the changed code and the surrounding ownership boundaries.
3. Challenge the implementation against the standards above.
4. Produce findings, or explicitly state that there are none.
5. After fixes, re-review the affected areas instead of assuming they are now clean.

## Rules

Always:

- prioritize real defects and architectural risks over praise or summary
- be explicit when something is an inference versus directly evidenced
- call out scale risks even if the code is otherwise correct
- call out maintainability and extendability issues before they calcify
- prefer primary sources when validating best-practice claims

Never:

- lead with compliments
- bury findings under a long summary
- waive a concern just because it looks small
- claim a best practice confidently when you are not sure
- confuse review with verification
