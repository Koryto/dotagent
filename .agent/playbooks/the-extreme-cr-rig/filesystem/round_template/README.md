# Round Template

This directory is copied into a live round workspace.

## Standard Flow

1. Stinson populates `00_round_context.md`.
2. Stinson populates `10_previous_round_feedback.md` before Wingmen start when the round is not the first round.
3. Wingmen write findings under `reviewers/`.
4. Stinson writes:
   - `lead/20_reviewer_feedback.md`
   - `lead/30_round_results.md`
5. Human approves the round results or asks for another Stinson pass.
6. Fixes and verification artifacts are written when needed.
7. Stinson records `60_round_verdict.md` after the human decides:
   - `merge`
   - `another_round`

## Quick Round Flow

Use quick rounds when the branch is already near merge and only low-signal follow-up remains.

Quick rounds may skip `lead/20_reviewer_feedback.md` and use a compact `lead/30_round_results.md`.

## Required Files

- `00_round_context.md`
- `reviewers/`
- `60_round_verdict.md`

Required for non-initial rounds:

- `10_previous_round_feedback.md`
