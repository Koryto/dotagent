# Deep Code Review

`deep-code-review` is an experimental playbook package for large or high-risk code review.

It packages a lead-centric multi-agent iterative review procedure that is heavier than a normal self-review but more structured than ad hoc multi-agent chat.

Use it when:

- the diff is too large for one human and one agent pass to review well
- the changed path is critical enough to justify multi-round review
- you want reviewer findings, lead synthesis, and human approval to remain explicit and inspectable

Native entry skills:

- `dcr-lead-init`
- `dcr-reviewer-init`
