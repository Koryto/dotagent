# Deep Code Review
<!-- VERSION: 1.0 | STATUS: active -->

## Purpose

Run a structured multi-agent review loop for large or high-risk changes.

Use this playbook when:

- one human and one normal agent review pass are not enough
- the changed path is large, risky, or architecturally important
- you want findings, synthesis, and merge decisions to remain explicit

This playbook depends on:

- `.agent/skills/code-review/SKILL.md`

Current operating model:

- filesystem runtime
- CLI as the operator layer
- markdown artifacts as the review contract

## Roles

- **Human**
  - chooses reviewer count
  - owns disputed findings
  - defines merge criteria
  - decides `approved` or `another_round`

- **Lead**
  - initializes and operates the review with human guidance
  - ingests reviewer outputs
  - synthesizes findings
  - coordinates fixes and verification
  - asks the human for approvals and the final verdict

- **Reviewer N**
  - performs independent review
  - carries earlier findings forward between rounds
  - remains in the rig even after `No findings.`

## Round Model

A round is one complete review cycle over a specific reviewed state.

Each round starts from:

- exact review scope
- exact reviewed state
- relevant project rules and context
- expected reviewer roster
- explicit out-of-scope items when relevant
- human-owned merge criteria when relevant

Reviewers must verify the live file state before writing findings.

Diff-only review is not sufficient on its own.

### Round Modes

- **Standard**
  - use when the review still has meaningful finding volume or structural uncertainty
- **Quick**
  - use when the branch is already near merge and only low-signal follow-up remains
  - typical cases: no-findings confirmation, doc-only cleanup, one low-severity issue

Quick rounds should reduce ceremony, not remove rigor.

## Required Artifacts

Every round must have:

- `README.md`
- `00_round_context.md`
- `reviewers/`
- `60_round_verdict.md`

Every non-initial round must also have:

- `10_previous_round_feedback.md`

Standard rounds should also produce:

- `lead/20_reviewer_feedback.md`
- `lead/30_round_results.md`

Quick rounds may skip `lead/20_reviewer_feedback.md` when there is no meaningful carry-forward value for another round.

Verification artifacts are expected whenever fix batches or manual validation occur.

Task-level memory should be maintained in:

- `findings_ledger.md`

Only the lead updates `findings_ledger.md` and assigns finding ids.

Reviewers must reference existing ids when the round packet or carry-forward artifacts provide them, but they do not create or remap ids on their own.

## Round Flow

1. **Round start**
   - the lead initializes or advances the review through the CLI when requested by the human.
   - Reviewers do not begin until the active round packet is ready.

2. **Independent review**
   - each reviewer reviews using `.agent/skills/code-review/SKILL.md`
   - each reviewer checks prior findings when relevant, avoids repeating rejected points without new evidence, and enters lightweight follow-up mode after `No findings.` instead of dropping from the review

3. **Lead pass**
   - the lead ingests reviewer outputs and performs one synthesis pass
   - Classification should use:
     - `accepted`
     - `duplicate`
     - `stale`
     - `rejected`
     - `deferred`
     - `non-actionable`
   - the lead produces:
     - one reviewer-facing artifact
     - one human-facing round-results artifact
   - the lead updates `findings_ledger.md` with stable ids and current disposition

4. **Human review**
   - the human reviews the round results and execution plan
   - the human may mark the round `approved`, request `another_round`, or override disputed lead judgment

5. **Fix and verification**
   - Accepted work is implemented and verified in small enough batches to isolate regressions.

6. **Re-review**
   - Review runs again on changed areas, impacted hotspots, and unresolved findings.
   - Quick rounds may collapse this into lighter closeout.

7. **Human verdict**
   - Every finished round is closed.
   - The only human verdicts are:
     - `approved`
     - `another_round`

## Runtime

This playbook runs through the filesystem runtime described in:

- `transport.md`

The concrete runtime template lives under:

- `template/`

## Rules

- the lead is the only synthesis authority
- Reviewers are signal producers, not coordinators
- the human owns disputed findings, merge criteria, and the final verdict
- fixes should be batched, not collapsed into one giant remediation pass
- Reviewers must consume prior round feedback before another round
- repeated findings must be justified as still-open or newly evidenced, not restated blindly
- only the lead assigns, updates, or remaps finding ids in shared artifacts
- non-initial rounds should not start without carry-forward artifacts
- a missing reviewer submission must be made explicit by the lead before the round proceeds
- a round may proceed with partial reviewer submissions only if the lead records that fact and the human accepts it
- verification should be written into artifacts, not left only in chat
- next-round creation is human-gated, not automatic
- when the human asks for `another_round`, the lead creates the next round, carries forward the required artifacts, and waits until the new packet is ready before reviewers begin
