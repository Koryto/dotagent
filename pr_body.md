## Summary

Refines the framework/runtime integration around the new CLI.

Main changes:
- removes the obsolete onboarding file and cleans up the root framework docs for the post-CLI model
- adds a real framework `init` skill under `.agent/skills/init/SKILL.md`
- replaces the old adapter entrypoint approach with runtime-native wrappers:
  - Codex / Copilot: `dotagent-*` skills
  - Claude: `dotagent/*` commands
  - OpenCode: `dotagent-*` commands
- adds runtime-specific YAML frontmatter for all generated wrappers
- adds runtime-local adapter manifests:
  - `.codex/dotagent.json`
  - `.claude/dotagent.json`
  - `.opencode/dotagent.json`
  - `.github/dotagent.json`
- normalizes legacy adapter records in the central manifest to the new runtime-only shape
- teaches `dotagent update` to refresh installed runtime wrappers/manifests automatically

## Behavior

- `dotagent init --runtimes ...` installs the framework plus native runtime wrappers
- `dotagent doctor` validates wrapper presence and runtime-local adapter manifests
- `dotagent update` now reconciles:
  - managed framework namespaces
  - installed runtime wrappers
  - installed runtime manifests

## Validation

Passed:
- `npm run typecheck`
- `npm run build`
- `npx tsc -p tsconfig.test.json`
- direct compiled suites:
  - `init.test`
  - `update.test`
  - `doctor.test`
  - `manifest.test`
  - `framework-skills.test`

Manual validation also passed on `py_test`:
- runtime wrapper generation and invocation
- playbook/init/adopt flows
- `update` repairing missing runtime-local adapter manifests
- final `doctor` health check with `issues: 0`
