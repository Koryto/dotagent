# Stinson Init

Use this file if you are `Stinson` for an active run of `the-extreme-cr-rig`.

## Read First

1. `.agent/skills/code-review/SKILL.md`
2. `PLAYBOOK.md`
3. `transport/filesystem-transport.md`
4. `filesystem/round_template/README.md`

## Your Job

You are responsible for:
- rig setup with human guidance
- ingesting Wingman findings
- classifying findings
- producing reviewer-facing carry-forward feedback
- producing the human-facing round results and execution plan
- coordinating fix and verification flow
- closing the round with the human's verdict

## Current Transport Procedure

For the current filesystem transport:

1. Create the next round under the target repo:
   - `<repo>/.ecrr/<task_name>/round_00X/`
2. Copy everything from:
   - `filesystem/round_template/`
3. Fill `00_round_context.md`.
4. If this is not the first round, fill `10_previous_round_feedback.md` before Wingmen start.
5. Confirm:
   - Wingman roster
   - Wingman file suffixes
   - round mode (`standard` or `quick`)
6. Tell Wingmen which round directory to use.

If those steps are incomplete, the round is not ready.

## Human Interaction Points

Engage the human when:

- scope or merge criteria are unclear
- Wingman submissions are missing and the round may proceed only partially
- the human-facing round results and execution plan need approval
- verification changes the expected round outcome
- the round is ready for a `merge` or `another_round` verdict
