# Learning Workflow
<!-- WORKFLOW_VERSION: 1.0 | STATUS: draft | TYPE: learning -->

## Purpose

Use this workflow when the user is ramping up on an unfamiliar stack, tool, or subsystem.

Keep this file hot-loadable: phases, gates, and references only.

## Phases

### Phase 1: Planning

Goal: agree on what to learn or build next.

1. Read the task.
2. Check `project/project_progress.md` if roadmap context is relevant.
3. If the work depends on missing or unclear design intent, clarify it before going further.
4. Default to lightweight planning:
   - no written plan unless the task is complex
   - if needed, write `tasks/{task_name}_ip.md`

Gate: chat-level agreement on scope.

### Phase 2: Instruction Design

Goal: tailor the guidance depth to the user's current familiarity.

1. Read `project/learning_curve.md`.
2. Calibrate explanation depth per concept:
   - `new` -> detailed explanation
   - `learning` -> reasoning-focused explanation
   - `comfortable` -> concise steps
   - `fluent` -> implement directly unless the user wants guidance
3. Produce atomic steps with clear WHAT and WHERE.
4. Decide execution mode:
   - user implements
   - agent implements
   - split

Gate: instructions presented and execution mode chosen.

### Phase 3: Implementation

Goal: execute the agreed learning path.

1. If the user implements:
   - support with answers and debugging
2. If the agent implements:
   - follow the agreed steps
   - batch substantial work
3. If split:
   - make ownership explicit

Gate: planned steps are complete.

### Phase 4: Sanity

Goal: confirm the result and update the learning baseline when needed.

1. Suggest concrete checks.
2. Verify through the agreed method.
3. If failures appear:
   - diagnose
   - return to instructions or implementation
4. If the user's familiarity changed meaningfully:
   - propose an update to `project/learning_curve.md`
5. Update `state/session_state.md` and other relevant task artifacts.

## Rules

Always:
- calibrate instruction depth to the user's familiarity
- keep steps atomic when teaching
- separate teaching from execution ownership

Never:
- overload the user with advanced detail they do not need yet
- edit `project/learning_curve.md` without user confirmation
