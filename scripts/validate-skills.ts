import * as fs from "node:fs";
import * as path from "node:path";

export interface SkillFrontmatter {
  name: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface SkillValidationResult {
  skillName: string;
  skillPath: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  frontmatter?: SkillFrontmatter;
  sectionsFound: string[];
  codeBlockCount: number;
  importsFound: string[];
}

export interface SkillsValidationReport {
  valid: boolean;
  totalSkills: number;
  skills: SkillValidationResult[];
  errors: string[];
  warnings: string[];
}

/**
 * Parses simple YAML frontmatter delimited by ---
 */
export function parseFrontmatter(content: string): { frontmatter: SkillFrontmatter | null; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, body: content };
  }

  const rawYaml = match[1];
  const body = match[2];

  const frontmatter: Partial<SkillFrontmatter> = {};
  const lines = rawYaml.split(/\r?\n/);
  let currentKey = "";
  let insideMetadata = false;
  const metadataObj: Record<string, unknown> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (trimmed.startsWith("metadata:")) {
      insideMetadata = true;
      currentKey = "metadata";
      continue;
    }

    if (insideMetadata && line.startsWith("  ")) {
      const metaMatch = trimmed.match(/^([A-Za-z0-9_-]+):\s*["']?(.*?)["']?$/);
      if (metaMatch) {
        metadataObj[metaMatch[1]] = metaMatch[2];
      }
      continue;
    } else {
      insideMetadata = false;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key === "name") frontmatter.name = val;
      if (key === "description") frontmatter.description = val;
      currentKey = key;
    } else if (currentKey === "description" && line.startsWith("  ")) {
      // Multiline description support
      frontmatter.description = (frontmatter.description ? frontmatter.description + " " : "") + trimmed;
    }
  }

  if (Object.keys(metadataObj).length > 0) {
    frontmatter.metadata = metadataObj;
  }

  if (!frontmatter.name || !frontmatter.description) {
    return { frontmatter: null, body };
  }

  return { frontmatter: frontmatter as SkillFrontmatter, body };
}

/**
 * Validates a single skill file.
 */
export function validateSkillFile(filePath: string, repoRoot?: string): SkillValidationResult {
  const root = repoRoot ?? path.resolve(filePath, "../../..");
  const result: SkillValidationResult = {
    skillName: path.basename(path.dirname(filePath)),
    skillPath: filePath,
    valid: true,
    errors: [],
    warnings: [],
    sectionsFound: [],
    codeBlockCount: 0,
    importsFound: [],
  };

  if (!fs.existsSync(filePath)) {
    result.valid = false;
    result.errors.push(`Skill file does not exist: ${filePath}`);
    return result;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const { frontmatter, body } = parseFrontmatter(content);

  if (!frontmatter) {
    result.valid = false;
    result.errors.push("Missing or invalid YAML frontmatter (must contain 'name' and 'description')");
    return result;
  }

  result.frontmatter = frontmatter;

  // 1. Frontmatter Validation
  const dirName = path.basename(path.dirname(filePath));
  if (frontmatter.name !== dirName) {
    result.valid = false;
    result.errors.push(`Skill name in frontmatter ('${frontmatter.name}') does not match directory name ('${dirName}')`);
  }

  if (!frontmatter.description || frontmatter.description.trim().length < 20) {
    result.valid = false;
    result.errors.push("Skill description must be at least 20 characters long");
  }

  const descLower = frontmatter.description.toLowerCase();
  if (!descLower.includes("use this skill") && !descLower.includes("guide") && !descLower.includes("when")) {
    result.warnings.push("Description should ideally clarify when an AI agent should activate or use this skill");
  }

  // 2. Section Structure Validation
  const headingMatches = [...body.matchAll(/^#{1,3}\s+(.+)$/gm)].map((m) => m[1].trim());
  result.sectionsFound = headingMatches;

  const hasWhenToUse = headingMatches.some((h) => /when to use/i.test(h));
  const hasWorkflow = headingMatches.some((h) => /workflow|step-by-step/i.test(h));
  const hasApiOrExamples = headingMatches.some((h) => /api|example|catalog|pattern/i.test(h));
  const hasA11yOrPerf = headingMatches.some((h) => /accessibility|performance|best practice/i.test(h));
  const hasPitfallsOrRelated = headingMatches.some((h) => /pitfall|troubleshoot|related/i.test(h));

  if (!hasWhenToUse) {
    result.errors.push("Missing required section: 'When to Use & When NOT to Use'");
  }
  if (!hasWorkflow) {
    result.errors.push("Missing required section: 'Step-by-Step Agent Workflow'");
  }
  if (!hasApiOrExamples) {
    result.errors.push("Missing required section for APIs, Patterns, or Implementation Examples");
  }
  if (!hasA11yOrPerf) {
    result.warnings.push("Missing section covering Accessibility and Performance considerations");
  }
  if (!hasPitfallsOrRelated) {
    result.warnings.push("Missing section covering Common Pitfalls or Troubleshooting");
  }

  // 3. Code Blocks & Examples
  const codeBlocks = [...body.matchAll(/```(?:tsx?|ts|js|jsx)\r?\n([\s\S]*?)```/g)];
  result.codeBlockCount = codeBlocks.length;

  if (codeBlocks.length === 0) {
    result.errors.push("Skill must contain at least one concrete, copyable code example");
  }

  // 4. Import Path Validation
  for (const block of codeBlocks) {
    const code = block[1];
    const importMatches = [...code.matchAll(/from\s+["'](af-motion(?:\/[a-z0-9_-]+)?)["']/g)].map((m) => m[1]);
    result.importsFound.push(...importMatches);
  }

  const allowedSubpaths = new Set(["af-motion", "af-motion/react", "af-motion/catalogue", "af-motion/presets"]);
  for (const imp of result.importsFound) {
    if (!allowedSubpaths.has(imp)) {
      result.errors.push(`Invalid package import subpath found in example: '${imp}'`);
    }
  }

  // 5. Internal Links Validation
  const linkMatches = [...body.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];
  for (const match of linkMatches) {
    const target = match[2];
    if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("#")) {
      continue;
    }
    // Clean file:/// or relative paths
    let relativeTarget = target.replace(/^file:\/\/\/?/, "");
    if (relativeTarget.startsWith("skills/")) {
      relativeTarget = path.join(root, relativeTarget);
    } else {
      relativeTarget = path.resolve(path.dirname(filePath), relativeTarget);
    }

    if (!fs.existsSync(relativeTarget)) {
      result.errors.push(`Broken internal skill reference: link to '${target}' does not exist on disk`);
    }
  }

  if (result.errors.length > 0) {
    result.valid = false;
  }

  return result;
}

/**
 * Validates all skills in the given directory.
 */
export function validateAllSkills(skillsDir: string): SkillsValidationReport {
  const report: SkillsValidationReport = {
    valid: true,
    totalSkills: 0,
    skills: [],
    errors: [],
    warnings: [],
  };

  if (!fs.existsSync(skillsDir)) {
    report.valid = false;
    report.errors.push(`Skills directory does not exist: ${skillsDir}`);
    return report;
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skillDirs = entries.filter((e) => e.isDirectory());
  const seenSkillNames = new Set<string>();

  for (const dir of skillDirs) {
    const skillPath = path.join(skillsDir, dir.name, "SKILL.md");
    if (!fs.existsSync(skillPath)) {
      report.errors.push(`Directory '${dir.name}' is missing a 'SKILL.md' file`);
      report.valid = false;
      continue;
    }

    const result = validateSkillFile(skillPath, path.dirname(skillsDir));
    report.skills.push(result);
    report.totalSkills++;

    if (seenSkillNames.has(result.skillName)) {
      report.errors.push(`Duplicate skill name detected: '${result.skillName}'`);
      report.valid = false;
    }
    seenSkillNames.add(result.skillName);

    if (!result.valid) {
      report.valid = false;
      for (const err of result.errors) {
        report.errors.push(`[${result.skillName}] ${err}`);
      }
    }

    for (const warn of result.warnings) {
      report.warnings.push(`[${result.skillName}] ${warn}`);
    }
  }

  // Validate index.json if present
  const indexPath = path.join(skillsDir, "index.json");
  if (fs.existsSync(indexPath)) {
    try {
      const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      if (!Array.isArray(index.skills)) {
        report.errors.push("skills/index.json must contain an array in 'skills'");
        report.valid = false;
      } else {
        const indexSkillNames = new Set(index.skills.map((s: { name: string }) => s.name));
        for (const skillName of seenSkillNames) {
          if (!indexSkillNames.has(skillName)) {
            report.warnings.push(`Skill '${skillName}' is not registered in skills/index.json`);
          }
        }
      }
    } catch (err) {
      report.errors.push(`Failed to parse skills/index.json: ${err instanceof Error ? err.message : String(err)}`);
      report.valid = false;
    }
  } else {
    report.warnings.push("Missing skills/index.json discovery file");
  }

  return report;
}
