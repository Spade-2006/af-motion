import * as path from "node:path";
import * as fs from "node:fs";
import { describe, it, expect } from "vitest";
import {
  parseFrontmatter,
  validateSkillFile,
  validateAllSkills,
} from "../scripts/validate-skills.js";
import * as coreApi from "../src/index.js";
import * as reactApi from "../src/react.js";
import * as catalogueApi from "../src/catalogue.js";
import * as presetsApi from "../src/presets.js";

const SKILLS_DIR = path.resolve(__dirname, "../skills");

describe("Prompt 89 - AI Agent Skills & Reusable Instructions", () => {
  describe("Repository Skills Validation", () => {
    it("validates that the skills directory exists and contains all required skills", () => {
      const report = validateAllSkills(SKILLS_DIR);
      if (report.errors.length > 0) {
        console.error("Skill validation errors:", report.errors);
      }
      expect(report.valid).toBe(true);
      expect(report.totalSkills).toBeGreaterThanOrEqual(13);
      expect(report.errors).toHaveLength(0);
    });

    it("verifies all 12 required skills plus central router are present", () => {
      const report = validateAllSkills(SKILLS_DIR);
      const names = report.skills.map((s) => s.skillName);

      expect(names).toContain("af-motion"); // Central router
      expect(names).toContain("fundamentals");
      expect(names).toContain("react-animation");
      expect(names).toContain("motion-intelligence");
      expect(names).toContain("visual-styles");
      expect(names).toContain("transitions-scroll");
      expect(names).toContain("interactive-components");
      expect(names).toContain("choreography-sync");
      expect(names).toContain("graphics-effects");
      expect(names).toContain("3d-scene-development");
      expect(names).toContain("motion-validation");
      expect(names).toContain("ai-generation");
      expect(names).toContain("mcp-integration");
    });

    it("verifies every skill has valid frontmatter with name and description", () => {
      const report = validateAllSkills(SKILLS_DIR);
      for (const skill of report.skills) {
        expect(skill.frontmatter).toBeDefined();
        expect(skill.frontmatter?.name).toBe(skill.skillName);
        expect(skill.frontmatter?.description.length).toBeGreaterThanOrEqual(20);
      }
    });

    it("verifies every skill contains copyable code examples with valid AF Motion imports", () => {
      const report = validateAllSkills(SKILLS_DIR);
      for (const skill of report.skills) {
        expect(skill.codeBlockCount).toBeGreaterThanOrEqual(1);
        expect(skill.importsFound.length).toBeGreaterThan(0);
      }
    });

    it("verifies skills/index.json discovery registry is valid and registers all skills", () => {
      const indexPath = path.join(SKILLS_DIR, "index.json");
      expect(fs.existsSync(indexPath)).toBe(true);
      const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      expect(index.version).toBe("1.0.0");
      expect(Array.isArray(index.skills)).toBe(true);
      expect(index.skills.length).toBeGreaterThanOrEqual(13);

      for (const item of index.skills) {
        expect(item.name).toBeTruthy();
        expect(item.path).toBeTruthy();
        expect(item.category).toBeTruthy();
        expect(item.description).toBeTruthy();
        expect(Array.isArray(item.triggers)).toBe(true);
        expect(fs.existsSync(path.resolve(__dirname, "..", item.path))).toBe(true);
      }
    });

    it("verifies skills/README.md documentation exists", () => {
      const readmePath = path.join(SKILLS_DIR, "README.md");
      expect(fs.existsSync(readmePath)).toBe(true);
      const content = fs.readFileSync(readmePath, "utf8");
      expect(content).toContain("Google Antigravity");
      expect(content).toContain("Cursor");
      expect(content).toContain("Claude Code");
    });
  });

  describe("API Consistency & Accuracy Check", () => {
    it("ensures imported APIs in skill examples exist in the actual library exports", () => {
      const report = validateAllSkills(SKILLS_DIR);
      const availableExports: Record<string, Set<string>> = {
        "af-motion": new Set(Object.keys(coreApi)),
        "af-motion/react": new Set(Object.keys(reactApi)),
        "af-motion/catalogue": new Set(Object.keys(catalogueApi)),
        "af-motion/presets": new Set(Object.keys(presetsApi)),
      };

      for (const skill of report.skills) {
        const content = fs.readFileSync(skill.skillPath, "utf8");
        // Extract imported identifiers: import { a, b } from "af-motion/..."
        const importRegex = /import\s*\{([^}]+)\}\s*from\s*["'](af-motion(?:\/[a-z0-9_-]+)?)["']/g;
        let match: RegExpExecArray | null;

        while ((match = importRegex.exec(content)) !== null) {
          const identifiers = match[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
          const subpath = match[2];
          const exportSet = availableExports[subpath];

          if (exportSet) {
            for (const id of identifiers) {
              // Types and interfaces might not be runtime keys, but runtime functions/components/constants must be
              // We check if the symbol is in exports or known type exports
              const isExported = exportSet.has(id);
              if (!isExported) {
                // Check if it's an interface / type exported from source
                const isTypeExport = id.endsWith("Props") || id.endsWith("Config") || id.endsWith("Options") || id.endsWith("State");
                if (!isTypeExport) {
                  // Fail if a runtime function/component was hallucinated
                  expect(isExported).toBe(true);
                }
              }
            }
          }
        }
      }
    });
  });

  describe("Validator Unit & Edge Cases", () => {
    it("parses valid YAML frontmatter accurately", () => {
      const sample = `---
name: test-skill
description: A comprehensive test skill for unit testing purposes.
metadata:
  category: testing
  version: "1.0.0"
---
# Test Content
`;
      const { frontmatter, body } = parseFrontmatter(sample);
      expect(frontmatter).toBeDefined();
      expect(frontmatter?.name).toBe("test-skill");
      expect(frontmatter?.description).toBe("A comprehensive test skill for unit testing purposes.");
      expect(frontmatter?.metadata?.category).toBe("testing");
      expect(body.trim()).toBe("# Test Content");
    });

    it("returns null frontmatter when delimiters are missing", () => {
      const sample = `# No frontmatter`;
      const { frontmatter } = parseFrontmatter(sample);
      expect(frontmatter).toBeNull();
    });

    it("detects missing frontmatter error in validateSkillFile", () => {
      const tempPath = path.join(SKILLS_DIR, "temp-test.md");
      fs.writeFileSync(tempPath, "# Incomplete skill without frontmatter", "utf8");
      try {
        const res = validateSkillFile(tempPath);
        expect(res.valid).toBe(false);
        expect(res.errors[0]).toContain("Missing or invalid YAML frontmatter");
      } finally {
        fs.unlinkSync(tempPath);
      }
    });

    it("detects name mismatch between directory and frontmatter", () => {
      const sample = `---
name: wrong-name
description: Test skill with incorrect name.
---
## When to Use & When NOT to Use
## Step-by-Step Agent Workflow
## API Reference
\`\`\`ts
import { animate } from "af-motion";
\`\`\`
`;
      const tempDir = path.join(SKILLS_DIR, "sample-dir");
      fs.mkdirSync(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, "SKILL.md");
      fs.writeFileSync(tempFile, sample, "utf8");

      try {
        const res = validateSkillFile(tempFile);
        expect(res.valid).toBe(false);
        expect(res.errors.some((e) => e.includes("does not match directory name"))).toBe(true);
      } finally {
        fs.unlinkSync(tempFile);
        fs.rmdirSync(tempDir);
      }
    });

    it("detects missing required sections", () => {
      const sample = `---
name: minimal-skill
description: Test skill missing required sections.
---
# Incomplete Heading Lacking Core Criteria
\`\`\`ts
import { animate } from "af-motion";
\`\`\`
`;
      const tempDir = path.join(SKILLS_DIR, "minimal-skill");
      fs.mkdirSync(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, "SKILL.md");
      fs.writeFileSync(tempFile, sample, "utf8");

      try {
        const res = validateSkillFile(tempFile);
        expect(res.valid).toBe(false);
        expect(res.errors.some((e) => e.includes("When to Use"))).toBe(true);
        expect(res.errors.some((e) => e.includes("Agent Workflow"))).toBe(true);
      } finally {
        fs.unlinkSync(tempFile);
        fs.rmdirSync(tempDir);
      }
    });
  });
});
