# Specs Namespace

`specs/` stores intended design.

Use this namespace when the project needs a durable statement of what should be true before implementation proceeds.

Good specs describe:

- target architecture
- design intent
- behavior that is not implemented yet
- accepted constraints and tradeoffs
- interfaces or boundaries that future code should follow

Do not use `specs/` for:

- current implementation notes
- task-local plans
- review findings
- temporary exploration notes

Those belong in `systems/` or `tasks/` depending on whether they describe durable reality or task-local work.

Useful patterns:

- `specs/architecture/<system>.md`
- `specs/<feature>/hld.md`
- `specs/<feature>/contract.md`

When implementation diverges from a spec, either update the spec intentionally or capture the implemented reality under `systems/`. Do not let both drift silently.
