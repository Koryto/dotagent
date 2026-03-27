# Deep Co-Planning
<!-- VERSION: 0.1 | STATUS: experimental -->

## Purpose

Run a structured multi-agent planning loop that turns a human-led HLD into one or more implementation-driving specs.

Use this playbook when:

- the work is too broad for a normal task-level implementation plan
- the human wants reviewer pressure before committing to a phase-level design
- the output should guide multiple later tasks or implementation plans
- the planning work needs preserved reviewer artifacts and explicit approval gates

Current operating model:

- filesystem runtime
- CLI as the operator layer
- markdown artifacts as the planning contract

## Roles

- **Human**
  - owns the planning objective and phase scope
  - chooses reviewer count
  - may assign reviewer domains
  - approves the HLD baseline
  - approves the final spec or spec set
  - decides whether another round is warranted

- **Lead**
  - centralizes the planning work with the human
  - co-authors the HLD with the human
  - initializes and operates the playbook runtime
  - ingests reviewer output
  - synthesizes reviewer pressure into the working artifacts
  - derives the final spec or spec set from the approved HLD
  - surfaces all questions to the human before a round closes

- **Reviewer N**
  - performs independent critique against the current HLD or spec artifacts
  - may be assigned a specific domain by the human
  - raises gaps in scope, sequencing, feasibility, architecture, risk, verification, or decomposition
  - does not own final synthesis

## Core Artifacts

Task-level artifacts:

- `HLD.md`
- `specs/`

Round-level artifacts:

- `README.md`
- `00_round_context.md`
- `reviewers/`
- `60_round_verdict.md`

Every non-initial round must also have:

- `10_previous_round_feedback.md`

Standard rounds should also produce:

- `lead/20_reviewer_feedback.md`
- `lead/30_round_results.md`

Only the lead updates shared synthesis artifacts.

Reviewers write their own output files only.

## Lifecycle

1. **Initialization**
   - define the planning objective
   - define the intended implementation-phase scope
   - choose reviewer roster
   - assign reviewer domains when useful
   - confirm this work is broad enough to justify Deep Co-Planning

2. **Discussion**
   - the lead starts with open discussion before hardening the planning target into HLD structure
   - the goal is to understand the real planning target before the first HLD draft
   - if the work is obviously too narrow, the lead should recommend the normal standard workflow instead

3. **HLD drafting**
   - the lead and human turn the discussion into a concrete HLD together
   - this HLD becomes the baseline artifact for the first review round
   - if the work is obviously too narrow, the lead should recommend the normal standard workflow instead

4. **HLD review round(s)**
   - reviewers independently critique the HLD
   - the lead synthesizes reviewer pressure
   - broad or under-scoped HLDs must be called out explicitly
   - open questions must be surfaced to the human before the round closes

5. **HLD approval gate**
   - the human marks the HLD round `approved` to use it as the baseline for spec derivation
   - the lead may recommend decomposition if the HLD is too broad, but the human decides whether to proceed

6. **Spec derivation**
   - the lead derives one or more specs from the approved HLD
   - a well-contained HLD should usually yield one spec
   - a broader HLD may legitimately yield a spec set

7. **Spec review round(s)**
   - reviewers independently challenge the derived spec artifact set
   - focus on decomposition quality, sequencing, technical feasibility, missing interfaces, risks, and verification expectations
   - open questions must again be surfaced to the human before the round closes

8. **Spec approval gate**
   - the human marks the final spec or spec set `approved`
   - anything unresolved at this point must be recorded as a known unknown, not left as a hidden open question

## Round Model

A round is one complete critique-and-synthesis cycle over a specific planning state.

Each round must declare:

- `round_focus`: `hld-review` or `spec-review`
- exact artifacts under review
- reviewer roster
- reviewer domain assignments when present
- the approval target for the round
- out-of-scope items when relevant

Minimum participation is one round.

Further rounds are human-gated.

## Round Flow

1. **Round start**
   - the lead initializes or advances the planning workspace through the CLI when requested by the human
   - reviewers do not begin until the active round packet is ready

2. **Independent review**
   - each reviewer reads the active artifacts and produces an independent critique
   - reviewer output should stay concrete, technical, and scoped to the planning state under review

3. **Lead synthesis**
   - the lead ingests reviewer output
   - classification should use:
     - `accepted`
     - `duplicate`
     - `resolved`
     - `rejected`
     - `deferred`
     - `known_unknown`
   - the lead updates the working HLD or specs as needed
   - the lead produces:
     - one reviewer-facing carry-forward artifact
     - one human-facing round-results artifact

4. **Human review**
   - the human reviews the round results
   - the lead surfaces open questions explicitly
   - the human may answer them, redirect scope, request `another_round`, or mark the round `approved`

5. **Next action**
   - if the human requests `another_round`, the lead creates the next round and carries forward the required artifacts
   - if an HLD round is `approved`, move into spec derivation
   - if a final spec round is `approved`, the playbook is complete

## Runtime

This playbook runs through the filesystem runtime described in:

- `transport.md`

The concrete runtime template lives under:

- `template/`

## Rules

- the lead is the only synthesis authority
- reviewers are signal producers, not coordinators
- reviewer domain assignment is optional but supported
- if the work is too narrow, the lead should recommend the normal standard workflow instead
- if the HLD is too broad, the lead and reviewers must say so clearly, but the human still decides whether to proceed
- HLD approval and final spec approval are both human-gated
- no round should close with hidden open questions
- unresolved items in the final HLD or specs must be recorded as known unknowns
- the final specs must sharpen the HLD into implementation-driving structure; they must not merely restate it
- reviewer outputs and lead synthesis should remain readable enough for later task-level implementation planning
- when the human asks for `another_round`, the lead creates the next round, carries forward the required artifacts, and waits until the new packet is ready before reviewers begin
