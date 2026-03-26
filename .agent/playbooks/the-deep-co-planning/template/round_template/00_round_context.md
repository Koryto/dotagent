# Round Context

## Round Identity

- task_name:
- round_id:
- round_focus: hld-review / spec-review
- round_status:

## Active Artifacts

- primary_artifacts_under_review:
- prior_artifacts_to_reference:

## Planning Scope

- implementation_phase_scope:
- reviewer_domains:
- out_of_scope:

## Approval Target

- target: approve_hld / approve_specs / another_round

## Read Order

1. `../HLD.md`
2. `../known_unknowns.md`
3. `../specs/README.md`
4. any active spec files named in this round
5. `10_previous_round_feedback.md` when this is not the first round

## Missing-Artifact Policy

- if the requested round does not exist, stop and wait
- do not infer missing planning state from chat or git history
- do not start until the packet fields above are filled
