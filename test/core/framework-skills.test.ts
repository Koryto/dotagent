import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { assertBundledFrameworkSkillsAvailable, listBundledFrameworkSkills } from "../../src/core/framework-skills.js";
import { BundledAssetsError } from "../../src/utils/errors.js";

test("listBundledFrameworkSkills throws when a bundled skill directory is missing SKILL.md", () => {
  const bundledAgentRoot = mkdtempSync(path.join(os.tmpdir(), "dotagent-framework-skills-missing-file-"));
  mkdirSync(path.join(bundledAgentRoot, "skills", "broken"), { recursive: true });

  assert.throws(() => listBundledFrameworkSkills(bundledAgentRoot), BundledAssetsError);
});

test("assertBundledFrameworkSkillsAvailable throws when no bundled skills are available", () => {
  const bundledAgentRoot = mkdtempSync(path.join(os.tmpdir(), "dotagent-framework-skills-empty-"));
  mkdirSync(path.join(bundledAgentRoot, "skills"), { recursive: true });

  assert.throws(() => assertBundledFrameworkSkillsAvailable(bundledAgentRoot, []), BundledAssetsError);
});

test("assertBundledFrameworkSkillsAvailable accepts valid bundled skills", () => {
  const bundledAgentRoot = mkdtempSync(path.join(os.tmpdir(), "dotagent-framework-skills-valid-"));
  const skillRoot = path.join(bundledAgentRoot, "skills", "closeout");
  mkdirSync(skillRoot, { recursive: true });
  writeFileSync(path.join(skillRoot, "SKILL.md"), "---\nname: \"closeout\"\ndescription: \"Close out the task.\"\n---\n# closeout\n", "utf8");

  const skills = listBundledFrameworkSkills(bundledAgentRoot);

  assert.doesNotThrow(() => assertBundledFrameworkSkillsAvailable(bundledAgentRoot, skills));
  assert.deepEqual(skills, [
    {
      bundledRelativePath: "skills/closeout/SKILL.md",
      invocationArgs: [],
      skillName: "closeout",
      sourcePath: ".agent/skills/closeout/SKILL.md"
    }
  ]);
});

test("listBundledFrameworkSkills includes playbook-local skills", () => {
  const bundledAgentRoot = mkdtempSync(path.join(os.tmpdir(), "dotagent-framework-skills-playbook-local-"));
  const skillRoot = path.join(
    bundledAgentRoot,
    "playbooks",
    "deep-code-review",
    "skills",
    "dcr-lead-init"
  );
  mkdirSync(skillRoot, { recursive: true });
  writeFileSync(
    path.join(skillRoot, "SKILL.md"),
    "---\nname: \"dcr-lead-init\"\ndescription: \"Lead DCR.\"\ninvocation-args:\n  task_name: required\n---\n# dcr-lead-init\n",
    "utf8"
  );

  const skills = listBundledFrameworkSkills(bundledAgentRoot);

  assert.deepEqual(skills, [
    {
      bundledRelativePath: "playbooks/deep-code-review/skills/dcr-lead-init/SKILL.md",
      invocationArgs: [{ name: "task_name", required: true }],
      skillName: "dcr-lead-init",
      sourcePath: ".agent/playbooks/deep-code-review/skills/dcr-lead-init/SKILL.md"
    }
  ]);
});

test("listBundledFrameworkSkills rejects invalid invocation-args metadata", () => {
  const bundledAgentRoot = mkdtempSync(path.join(os.tmpdir(), "dotagent-framework-skills-invalid-args-"));
  const skillRoot = path.join(bundledAgentRoot, "skills", "broken");
  mkdirSync(skillRoot, { recursive: true });
  writeFileSync(
    path.join(skillRoot, "SKILL.md"),
    "---\nname: \"broken\"\ndescription: \"Broken.\"\ninvocation-args:\n  task_name: maybe\n---\n# broken\n",
    "utf8"
  );

  assert.throws(() => listBundledFrameworkSkills(bundledAgentRoot), BundledAssetsError);
});

test("listBundledFrameworkSkills rejects duplicated skill names across namespaces", () => {
  const bundledAgentRoot = mkdtempSync(path.join(os.tmpdir(), "dotagent-framework-skills-duplicate-name-"));
  const coreSkillRoot = path.join(bundledAgentRoot, "skills", "closeout");
  const playbookSkillRoot = path.join(
    bundledAgentRoot,
    "playbooks",
    "deep-code-review",
    "skills",
    "closeout"
  );
  mkdirSync(coreSkillRoot, { recursive: true });
  mkdirSync(playbookSkillRoot, { recursive: true });
  writeFileSync(path.join(coreSkillRoot, "SKILL.md"), "---\nname: \"closeout\"\ndescription: \"Closeout.\"\n---\n# closeout\n", "utf8");
  writeFileSync(path.join(playbookSkillRoot, "SKILL.md"), "---\nname: \"closeout\"\ndescription: \"Closeout.\"\n---\n# closeout\n", "utf8");

  assert.throws(() => listBundledFrameworkSkills(bundledAgentRoot), BundledAssetsError);
});
