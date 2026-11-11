import * as path from "node:path";
import * as fs from "node:fs";
import { spawn } from "node:child_process";
import { describe, it, expect } from "vitest";

const ROOT_DIR = path.resolve(__dirname, "..");
const INTEGRATIONS_DIR = path.resolve(ROOT_DIR, "integrations");
const MANIFEST_PATH = path.join(INTEGRATIONS_DIR, "manifest.json");

describe("Prompt 90 & 91 - Multi-Agent Integrations (Codex, Claude, Cursor, Antigravity, VS Code)", () => {
  describe("Shared Agent Integration Manifest", () => {
    it("has a valid integrations/manifest.json matching schema with all 5 environments", () => {
      expect(fs.existsSync(MANIFEST_PATH)).toBe(true);
      const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

      expect(manifest.name).toBe("af-motion-agent-integrations");
      expect(manifest.version).toBe("1.0.0");
      expect(manifest.skills).toBeDefined();
      expect(manifest.mcp).toBeDefined();
      expect(manifest.agents).toBeDefined();

      // Check skill paths
      expect(fs.existsSync(path.join(ROOT_DIR, manifest.skills.root))).toBe(true);
      expect(fs.existsSync(path.join(ROOT_DIR, manifest.skills.index))).toBe(true);
      expect(fs.existsSync(path.join(ROOT_DIR, manifest.skills.primary))).toBe(true);

      // Check MCP server entry
      expect(fs.existsSync(path.join(ROOT_DIR, manifest.mcp.serverEntry))).toBe(true);
      expect(manifest.mcp.toolsCount).toBe(20);
      expect(manifest.mcp.resourcesCount).toBe(6);
      expect(manifest.mcp.promptsCount).toBe(6);

      // Check all 5 supported agents
      expect(manifest.agents.antigravity).toBeDefined();
      expect(manifest.agents.vscode).toBeDefined();
      expect(manifest.agents.codex).toBeDefined();
      expect(manifest.agents["claude-code"]).toBeDefined();
      expect(manifest.agents.cursor).toBeDefined();

      for (const [key, agent] of Object.entries(manifest.agents as Record<string, any>)) {
        expect(agent.name).toBeTruthy();
        expect(agent.status).toBe("supported");
        expect(agent.verificationStatus).toBeTruthy();
        expect(agent.skillEntry).toBeTruthy();
        expect(fs.existsSync(path.join(ROOT_DIR, agent.skillEntry))).toBe(true);
        expect(agent.documentation).toBeTruthy();
        expect(fs.existsSync(path.join(ROOT_DIR, agent.documentation))).toBe(true);
      }
    });

    it("ensures integrations/README.md documents all 5 environments", () => {
      const readmePath = path.join(INTEGRATIONS_DIR, "README.md");
      expect(fs.existsSync(readmePath)).toBe(true);
      const content = fs.readFileSync(readmePath, "utf8");

      expect(content).toContain("Google Antigravity");
      expect(content).toContain("Visual Studio Code");
      expect(content).toContain("OpenAI Codex");
      expect(content).toContain("Claude Code");
      expect(content).toContain("Cursor IDE");
      expect(content).toContain("bin/mcp-server.js");
    });
  });

  describe("Antigravity Integration (Prompt 91)", () => {
    it("provides valid Antigravity workspace instructions in integrations and repository root", () => {
      const geminiPath = path.join(INTEGRATIONS_DIR, "antigravity", "GEMINI.md");
      const rootGeminiPath = path.join(ROOT_DIR, "GEMINI.md");

      expect(fs.existsSync(geminiPath)).toBe(true);
      expect(fs.existsSync(rootGeminiPath)).toBe(true);

      const content = fs.readFileSync(geminiPath, "utf8");
      expect(content).toContain("AF Motion — Antigravity Agent Guidelines");
      expect(content).toContain("skills/af-motion/SKILL.md");
      expect(content).toContain("af-motion/react");
      expect(content).toContain("Antigravity Agent Workflow");
    });

    it("provides the dedicated 9-step Antigravity workflow guide", () => {
      const workflowPath = path.join(INTEGRATIONS_DIR, "antigravity", "workflow.md");
      expect(fs.existsSync(workflowPath)).toBe(true);

      const content = fs.readFileSync(workflowPath, "utf8");
      expect(content).toContain("The 9-Step Antigravity Motion Workflow");
      expect(content).toContain("1. Understand Requested Visual Result");
      expect(content).toContain("2. Discover Relevant AF Motion Capabilities");
      expect(content).toContain("3. Select Visual Style & Motion DNA");
      expect(content).toContain("4. Inspect Existing React Architecture");
      expect(content).toContain("5. Generate AF Motion Configurations");
      expect(content).toContain("Step 6: Compose Multi-System Motion");
      expect(content).toContain("7. Validate Accessibility & Performance");
      expect(content).toContain("8. Preserve Existing UI & Layout");
      expect(content).toContain("9. Verify Generated Code & Report Decisions");
    });

    it("provides valid Antigravity MCP configuration in integrations and repository root", () => {
      const mcpPath = path.join(INTEGRATIONS_DIR, "antigravity", "mcp_config.json");
      const rootMcpPath = path.join(ROOT_DIR, "mcp_config.json");

      expect(fs.existsSync(mcpPath)).toBe(true);
      expect(fs.existsSync(rootMcpPath)).toBe(true);

      const config = JSON.parse(fs.readFileSync(mcpPath, "utf8"));
      expect(config.mcpServers["af-motion"]).toBeDefined();
      expect(config.mcpServers["af-motion"].command).toBe("node");
      expect(config.mcpServers["af-motion"].args[0]).toBe("bin/mcp-server.js");
    });

    it("provides Antigravity README with scope, discovery, and troubleshooting docs", () => {
      const readmePath = path.join(INTEGRATIONS_DIR, "antigravity", "README.md");
      expect(fs.existsSync(readmePath)).toBe(true);
      const content = fs.readFileSync(readmePath, "utf8");

      expect(content).toContain("Workspace Scope");
      expect(content).toContain("Global Scope");
      expect(content).toContain("Skill Discovery & Registration");
      expect(content).toContain("MCP Server Configuration");
      expect(content).toContain("Troubleshooting & Recovery");
    });
  });

  describe("VS Code Integration (Prompt 91)", () => {
    it("provides workspace settings, extensions, and tasks in integrations and root .vscode/", () => {
      const vscodeDir = path.join(ROOT_DIR, ".vscode");
      const intDir = path.join(INTEGRATIONS_DIR, "vscode");

      expect(fs.existsSync(path.join(intDir, "settings.json"))).toBe(true);
      expect(fs.existsSync(path.join(vscodeDir, "settings.json"))).toBe(true);
      expect(fs.existsSync(path.join(intDir, "extensions.json"))).toBe(true);
      expect(fs.existsSync(path.join(vscodeDir, "extensions.json"))).toBe(true);
      expect(fs.existsSync(path.join(intDir, "tasks.json"))).toBe(true);
      expect(fs.existsSync(path.join(vscodeDir, "tasks.json"))).toBe(true);
      expect(fs.existsSync(path.join(intDir, "mcp.json"))).toBe(true);
      expect(fs.existsSync(path.join(vscodeDir, "mcp.json"))).toBe(true);

      // Check tasks
      const tasks = JSON.parse(fs.readFileSync(path.join(vscodeDir, "tasks.json"), "utf8"));
      expect(tasks.tasks.some((t: any) => t.label === "Build AF Motion")).toBe(true);
      expect(tasks.tasks.some((t: any) => t.label === "Run Tests")).toBe(true);
      expect(tasks.tasks.some((t: any) => t.label === "Start MCP Stdio Server")).toBe(true);
    });

    it("provides GitHub Copilot instructions in integrations and .github/", () => {
      const intCopilotPath = path.join(INTEGRATIONS_DIR, "vscode", "copilot-instructions.md");
      const rootCopilotPath = path.join(ROOT_DIR, ".github", "copilot-instructions.md");

      expect(fs.existsSync(intCopilotPath)).toBe(true);
      expect(fs.existsSync(rootCopilotPath)).toBe(true);

      const content = fs.readFileSync(intCopilotPath, "utf8");
      expect(content).toContain("skills/af-motion/SKILL.md");
      expect(content).toContain("af-motion/react");
      expect(content).toContain("GPU Transforms Only");
    });

    it("provides VS Code README distinguishing native IDE from AI extensions", () => {
      const readmePath = path.join(INTEGRATIONS_DIR, "vscode", "README.md");
      expect(fs.existsSync(readmePath)).toBe(true);
      const content = fs.readFileSync(readmePath, "utf8");

      expect(content).toContain("Native VS Code vs. AI Extensions");
      expect(content).toContain("GitHub Copilot Chat");
      expect(content).toContain("Continue.dev");
      expect(content).toContain("Cline / Roo Code");
      expect(content).toContain("Connecting the MCP Server");
    });
  });

  describe("Codex Integration (Prompt 90)", () => {
    it("provides valid Codex configuration file", () => {
      const configPath = path.join(INTEGRATIONS_DIR, "codex", "config.json");
      expect(fs.existsSync(configPath)).toBe(true);
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

      expect(config.name).toBe("af-motion-codex");
      expect(config.version).toBe("1.0.0");
      expect(config.instructions).toBe("integrations/codex/AGENTS.md");
      expect(fs.existsSync(path.join(ROOT_DIR, config.instructions))).toBe(true);

      expect(config.skills.directory).toBe("skills/");
      expect(fs.existsSync(path.join(ROOT_DIR, config.skills.directory))).toBe(true);
      expect(fs.existsSync(path.join(ROOT_DIR, config.skills.primarySkill))).toBe(true);

      expect(config.mcp.command).toBe("node");
      expect(config.mcp.args[0]).toBe("bin/mcp-server.js");
      expect(Object.keys(config.prompts).length).toBeGreaterThanOrEqual(4);
    });

    it("provides valid Codex instruction files in integrations and repository root", () => {
      const agentsPath = path.join(INTEGRATIONS_DIR, "codex", "AGENTS.md");
      const rootAgentsPath = path.join(ROOT_DIR, "AGENTS.md");

      expect(fs.existsSync(agentsPath)).toBe(true);
      expect(fs.existsSync(rootAgentsPath)).toBe(true);

      const content = fs.readFileSync(agentsPath, "utf8");
      expect(content).toContain("AF Motion — Codex Agent Instructions");
      expect(content).toContain("skills/af-motion/SKILL.md");
      expect(content).toContain("af-motion/react");
      expect(content).toContain("Deterministic Agent Workflow");
    });

    it("provides Codex README setup and removal documentation", () => {
      const readmePath = path.join(INTEGRATIONS_DIR, "codex", "README.md");
      expect(fs.existsSync(readmePath)).toBe(true);
      const content = fs.readFileSync(readmePath, "utf8");

      expect(content).toContain("Quick Setup");
      expect(content).toContain("MCP Server Setup");
      expect(content).toContain("Example Prompts");
      expect(content).toContain("Uninstallation / Removal");
    });
  });

  describe("Claude Code Integration (Prompt 90)", () => {
    it("provides valid CLAUDE.md project instruction files in integrations and repository root", () => {
      const claudePath = path.join(INTEGRATIONS_DIR, "claude-code", "CLAUDE.md");
      const rootClaudePath = path.join(ROOT_DIR, "CLAUDE.md");

      expect(fs.existsSync(claudePath)).toBe(true);
      expect(fs.existsSync(rootClaudePath)).toBe(true);

      const content = fs.readFileSync(claudePath, "utf8");
      expect(content).toContain("AF Motion — Claude Code Project Instructions");
      expect(content).toContain("skills/af-motion/SKILL.md");
      expect(content).toContain("af-motion/react");
      expect(content).toContain("claude mcp add");
    });

    it("provides valid Claude Desktop MCP configuration snippet", () => {
      const configPath = path.join(INTEGRATIONS_DIR, "claude-code", "claude-desktop-config.json");
      expect(fs.existsSync(configPath)).toBe(true);
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

      expect(config.mcpServers["af-motion"]).toBeDefined();
      expect(config.mcpServers["af-motion"].command).toBe("node");
      expect(config.mcpServers["af-motion"].args[0]).toBe("bin/mcp-server.js");
    });

    it("provides Claude Code README setup and removal documentation", () => {
      const readmePath = path.join(INTEGRATIONS_DIR, "claude-code", "README.md");
      expect(fs.existsSync(readmePath)).toBe(true);
      const content = fs.readFileSync(readmePath, "utf8");

      expect(content).toContain("claude mcp add af-motion");
      expect(content).toContain("claude_desktop_config.json");
      expect(content).toContain("Uninstallation / Removal");
    });
  });

  describe("Cursor Integration (Prompt 90)", () => {
    it("provides valid Cursor MDC rule file in integrations and repository root", () => {
      const mdcPath = path.join(INTEGRATIONS_DIR, "cursor", "rules", "af-motion.mdc");
      const rootMdcPath = path.join(ROOT_DIR, ".cursor", "rules", "af-motion.mdc");

      expect(fs.existsSync(mdcPath)).toBe(true);
      expect(fs.existsSync(rootMdcPath)).toBe(true);

      const content = fs.readFileSync(mdcPath, "utf8");
      expect(content.startsWith("---")).toBe(true);
      expect(content).toContain("description:");
      expect(content).toContain("globs:");
      expect(content).toContain("skills/af-motion/SKILL.md");
      expect(content).toContain("GPU Transforms Only");
    });

    it("provides valid .cursorrules files in integrations and repository root", () => {
      const cursorrulesPath = path.join(INTEGRATIONS_DIR, "cursor", ".cursorrules");
      const rootCursorrulesPath = path.join(ROOT_DIR, ".cursorrules");

      expect(fs.existsSync(cursorrulesPath)).toBe(true);
      expect(fs.existsSync(rootCursorrulesPath)).toBe(true);

      const content = fs.readFileSync(cursorrulesPath, "utf8");
      expect(content).toContain("skills/af-motion/SKILL.md");
      expect(content).toContain("af-motion/react");
    });

    it("provides valid Cursor MCP configuration in integrations and repository root", () => {
      const mcpPath = path.join(INTEGRATIONS_DIR, "cursor", "mcp.json");
      const rootMcpPath = path.join(ROOT_DIR, ".cursor", "mcp.json");

      expect(fs.existsSync(mcpPath)).toBe(true);
      expect(fs.existsSync(rootMcpPath)).toBe(true);

      const config = JSON.parse(fs.readFileSync(mcpPath, "utf8"));
      expect(config.mcpServers["af-motion"]).toBeDefined();
      expect(config.mcpServers["af-motion"].command).toBe("node");
      expect(config.mcpServers["af-motion"].args[0]).toBe("bin/mcp-server.js");
    });

    it("provides Cursor README setup and prompt documentation", () => {
      const readmePath = path.join(INTEGRATIONS_DIR, "cursor", "README.md");
      expect(fs.existsSync(readmePath)).toBe(true);
      const content = fs.readFileSync(readmePath, "utf8");

      expect(content).toContain(".cursor/rules/");
      expect(content).toContain(".cursorrules");
      expect(content).toContain("Cursor MCP Server Setup");
      expect(content).toContain("Uninstallation / Removal");
    });
  });

  describe("MCP Executable Server Integration", () => {
    it("ensures bin/mcp-server.js exists and responds to JSON-RPC over stdio", async () => {
      const serverPath = path.join(ROOT_DIR, "bin", "mcp-server.js");
      expect(fs.existsSync(serverPath)).toBe(true);

      const content = fs.readFileSync(serverPath, "utf8");
      expect(content).toContain("#!/usr/bin/env node");
      expect(content).toContain("StdioTransport");
      expect(content).toContain("createAFMotionMCPServer");

      // Test live process communication over stdio
      const response = await new Promise<any>((resolve, reject) => {
        const child = spawn("node", [serverPath], { stdio: ["pipe", "pipe", "pipe"] });
        let out = "";
        let err = "";

        let settled = false;
        const cleanup = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            try { child.stdin.end(); } catch {}
            try { child.kill(); } catch {}
          }
        };

        child.stdout.on("data", (d) => {
          out += d.toString();
          try {
            const parsed = JSON.parse(out.trim());
            cleanup();
            resolve(parsed);
          } catch {
            // Wait for full JSON-RPC response
          }
        });
        child.stderr.on("data", (d) => {
          err += d.toString();
        });

        child.on("error", (e) => {
          cleanup();
          reject(e);
        });

        // Send ping request
        child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 101, method: "ping" }) + "\n");

        const timer = setTimeout(() => {
          cleanup();
          if (err && !out) {
            reject(new Error(err));
          } else {
            try {
              const parsed = JSON.parse(out.trim());
              resolve(parsed);
            } catch (pErr) {
              reject(new Error(`Failed to parse response: '${out}'`));
            }
          }
        }, 3000);
      });

      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(101);
      expect(response.result).toEqual({});
    });
  });

  describe("Skill References & Consistency Across All Integrations", () => {
    it("verifies all referenced skills in all agent configurations exist on disk", () => {
      const filesToCheck = [
        path.join(INTEGRATIONS_DIR, "antigravity", "GEMINI.md"),
        path.join(INTEGRATIONS_DIR, "vscode", "copilot-instructions.md"),
        path.join(INTEGRATIONS_DIR, "codex", "AGENTS.md"),
        path.join(INTEGRATIONS_DIR, "claude-code", "CLAUDE.md"),
        path.join(INTEGRATIONS_DIR, "cursor", "rules", "af-motion.mdc"),
        path.join(INTEGRATIONS_DIR, "cursor", ".cursorrules"),
      ];

      for (const filePath of filesToCheck) {
        const content = fs.readFileSync(filePath, "utf8");
        const skillMatches = [...content.matchAll(/skills\/([a-z0-9_-]+)\/SKILL\.md/g)];
        expect(skillMatches.length).toBeGreaterThan(0);

        for (const match of skillMatches) {
          const relPath = match[0];
          const fullPath = path.join(ROOT_DIR, relPath);
          expect(fs.existsSync(fullPath)).toBe(true);
        }
      }
    });
  });
});
