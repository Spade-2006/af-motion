import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createAFMotionMCPServer,
  InMemoryTransport,
  StdioTransport,
  listMCPTools,
  executeMCPTool,
  listMCPResources,
  readMCPResource,
  listMCPPrompts,
  getMCPPrompt,
  MCP_SERVER_INFO,
  type JSONRPCRequest,
  type JSONRPCResponse,
  type AFMotionMCPServer,
} from "../src/catalogue.js";

describe("Prompt 88 - MCP Server & AI Capability Discovery", () => {
  describe("MCP Metadata & Direct Component Functions", () => {
    it("provides valid server metadata", () => {
      expect(MCP_SERVER_INFO.name).toBe("af-motion");
      expect(MCP_SERVER_INFO.version).toBe("1.0.0");
      expect(MCP_SERVER_INFO.protocolVersion).toBe("2024-11-05");
    });

    it("lists all 20 focused MCP tools with valid schemas", () => {
      const tools = listMCPTools();
      expect(tools.length).toBe(20);
      const toolNames = tools.map((t) => t.name);
      expect(toolNames).toContain("discover_capabilities");
      expect(toolNames).toContain("search_capabilities");
      expect(toolNames).toContain("get_capability_details");
      expect(toolNames).toContain("list_visual_styles");
      expect(toolNames).toContain("list_motion_dna");
      expect(toolNames).toContain("interpret_motion_prompt");
      expect(toolNames).toContain("generate_animation");
      expect(toolNames).toContain("generate_transition");
      expect(toolNames).toContain("generate_scroll_animation");
      expect(toolNames).toContain("generate_microinteraction");
      expect(toolNames).toContain("generate_choreography");
      expect(toolNames).toContain("generate_3d_scene");
      expect(toolNames).toContain("validate_motion");
      expect(toolNames).toContain("optimize_motion");
      expect(toolNames).toContain("correct_configuration");

      for (const tool of tools) {
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      }
    });

    it("lists all 6 MCP resource URIs", () => {
      const resources = listMCPResources();
      expect(resources.length).toBe(6);
      const uris = resources.map((r) => r.uri);
      expect(uris).toContain("af-motion://catalogue");
      expect(uris).toContain("af-motion://categories");
      expect(uris).toContain("af-motion://visual-styles");
      expect(uris).toContain("af-motion://motion-dna");
      expect(uris).toContain("af-motion://design-systems");
      expect(uris).toContain("af-motion://palettes");
    });

    it("reads all MCP resources as valid JSON contents", async () => {
      const resources = listMCPResources();
      for (const res of resources) {
        const content = await readMCPResource(res.uri);
        expect(content.uri).toBe(res.uri);
        expect(content.mimeType).toBe("application/json");
        expect(content.text).toBeDefined();
        const parsed = JSON.parse(content.text!);
        expect(parsed).toBeTruthy();
      }
    });

    it("throws error when reading unknown resource URI", async () => {
      await expect(readMCPResource("af-motion://unknown-resource")).rejects.toThrow(/not found|unknown/i);
    });

    it("lists all 6 guided MCP prompts with argument schemas", () => {
      const prompts = listMCPPrompts();
      expect(prompts.length).toBe(6);
      const promptNames = prompts.map((p) => p.name);
      expect(promptNames).toContain("react-animation-system");
      expect(promptNames).toContain("visual-style-page");
      expect(promptNames).toContain("scroll-storytelling");
      expect(promptNames).toContain("interactive-components");
      expect(promptNames).toContain("cross-system-choreography");
      expect(promptNames).toContain("validate-and-optimize");
    });

    it("generates structured messages from MCP prompts", async () => {
      const res = await getMCPPrompt("react-animation-system", {
        componentType: "card",
        style: "glassmorphism",
        intensity: "high",
      });
      expect(res.description).toBeTruthy();
      expect(res.messages.length).toBeGreaterThan(0);
      expect(res.messages[0].role).toBe("user");
      expect(res.messages[0].content.text).toContain("card");
      expect(res.messages[0].content.text).toContain("glassmorphism");
    });

    it("throws error for unknown MCP prompt name", async () => {
      await expect(getMCPPrompt("unknown-prompt")).rejects.toThrow("Unknown prompt");
    });
  });

  describe("MCP Tool Invocations", () => {
    it("executes discover_capabilities tool", async () => {
      const result = await executeMCPTool("discover_capabilities", {});
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.count).toBeGreaterThan(0);
      expect(parsed.categories).toBeDefined();
      expect(parsed.capabilities.length).toBeGreaterThan(0);
    });

    it("executes search_capabilities tool", async () => {
      const result = await executeMCPTool("search_capabilities", { query: "fade" });
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.query).toBe("fade");
      expect(Array.isArray(parsed.results)).toBe(true);
    });

    it("executes get_capability_details tool with valid and invalid IDs", async () => {
      const valid = await executeMCPTool("get_capability_details", { capabilityId: "core-animate" });
      const parsed = JSON.parse(valid.content[0].text);
      expect(parsed.found).toBe(true);

      const invalid = await executeMCPTool("get_capability_details", { capabilityId: "nonexistent-xyz" });
      const parsedInvalid = JSON.parse(invalid.content[0].text);
      expect(parsedInvalid.found).toBe(false);
    });

    it("executes list_visual_styles tool returning 19 visual styles", async () => {
      const result = await executeMCPTool("list_visual_styles", {});
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.count).toBe(19);
      expect(parsed.styles.length).toBe(19);
    });

    it("executes list_motion_dna tool returning DNA profiles", async () => {
      const result = await executeMCPTool("list_motion_dna", {});
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.count).toBeGreaterThan(0);
      expect(parsed.profiles.length).toBeGreaterThan(0);
    });

    it("executes interpret_motion_prompt tool", async () => {
      const result = await executeMCPTool("interpret_motion_prompt", {
        prompt: "Make the hero title slide smoothly from bottom on page load",
      });
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.prompt).toContain("hero title");
      expect(parsed.interpretation).toBeDefined();
    });

    it("executes generate_animation tool", async () => {
      const result = await executeMCPTool("generate_animation", {
        intent: "entrance",
        componentType: "card",
        visualStyle: "minimal",
      });
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    it("executes generate_transition tool", async () => {
      const result = await executeMCPTool("generate_transition", {
        type: "page",
        from: "/home",
        to: "/dashboard",
      });
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    it("executes generate_scroll_animation tool", async () => {
      const result = await executeMCPTool("generate_scroll_animation", {
        type: "reveal",
        viewportTarget: "section#features",
      });
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    it("executes generate_microinteraction tool", async () => {
      const result = await executeMCPTool("generate_microinteraction", {
        category: "button",
        style: "neobrutalism",
      });
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    it("executes generate_choreography tool", async () => {
      const result = await executeMCPTool("generate_choreography", {
        elements: ["#header", "#nav", "#hero"],
        staggerMs: 80,
      });
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    it("executes generate_3d_scene tool", async () => {
      const result = await executeMCPTool("generate_3d_scene", {
        prompt: "Glass sphere with floating rings and soft ambient lighting",
      });
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.specification).toBeDefined();
    });

    it("executes validate_motion and optimize_motion tools", async () => {
      const motionConfig = {
        duration: 300,
        easing: "ease-out",
        opacity: [0, 1],
      };

      const valResult = await executeMCPTool("validate_motion", { config: motionConfig });
      expect(valResult.isError).toBeFalsy();
      const valParsed = JSON.parse(valResult.content[0].text);
      expect(valParsed.valid).toBeDefined();

      const optResult = await executeMCPTool("optimize_motion", { config: motionConfig, level: "standard" });
      expect(optResult.isError).toBeFalsy();
      const optParsed = JSON.parse(optResult.content[0].text);
      expect(optParsed.optimizedConfig).toBeDefined();
    });

    it("executes correct_configuration tool", async () => {
      const result = await executeMCPTool("correct_configuration", {
        capabilityId: "fade",
        configuration: { duration: -50 },
      });
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.correctedConfiguration).toBeDefined();
    });

    it("returns error result for unknown tool", async () => {
      const result = await executeMCPTool("nonexistent_tool", {});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unknown tool");
    });
  });

  describe("AFMotionMCPServer Protocol Lifecycle via InMemoryTransport", () => {
    let server: AFMotionMCPServer;
    let transport: InMemoryTransport;
    let responses: JSONRPCResponse[];

    beforeEach(() => {
      transport = new InMemoryTransport();
      responses = [];
      transport.onClientMessage(async (msg) => {
        if ("id" in msg) {
          responses.push(msg as JSONRPCResponse);
        }
      });
      server = createAFMotionMCPServer({ transport });
    });

    afterEach(async () => {
      await server.close();
    });

    async function sendRequest(request: Partial<JSONRPCRequest> & { id: string | number; method: string }): Promise<JSONRPCResponse> {
      const fullReq: JSONRPCRequest = {
        jsonrpc: "2.0",
        ...request,
      };
      await transport.sendToServer(fullReq);
      const res = responses.find((r) => r.id === request.id);
      if (!res) throw new Error(`No response received for request ${request.id}`);
      return res;
    }

    it("initializes server and responds with protocol negotiation and capabilities", async () => {
      const res = await sendRequest({
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      expect(res.error).toBeUndefined();
      const result = res.result as Record<string, any>;
      expect(result.protocolVersion).toBe("2024-11-05");
      expect(result.serverInfo.name).toBe("af-motion");
      expect(result.capabilities.tools).toBeDefined();
      expect(result.capabilities.resources).toBeDefined();
      expect(result.capabilities.prompts).toBeDefined();
    });

    it("handles ping method", async () => {
      const res = await sendRequest({ id: 2, method: "ping" });
      expect(res.error).toBeUndefined();
      expect(res.result).toEqual({});
    });

    it("handles tools/list method", async () => {
      const res = await sendRequest({ id: 3, method: "tools/list" });
      expect(res.error).toBeUndefined();
      const result = res.result as Record<string, any>;
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools.length).toBe(20);
    });

    it("handles tools/call method with valid tool", async () => {
      const res = await sendRequest({
        id: 4,
        method: "tools/call",
        params: {
          name: "list_visual_styles",
          arguments: {},
        },
      });
      expect(res.error).toBeUndefined();
      const result = res.result as Record<string, any>;
      expect(result.content[0].type).toBe("text");
      const data = JSON.parse(result.content[0].text);
      expect(data.count).toBe(19);
    });

    it("handles resources/list method", async () => {
      const res = await sendRequest({ id: 5, method: "resources/list" });
      expect(res.error).toBeUndefined();
      const result = res.result as Record<string, any>;
      expect(result.resources.length).toBe(6);
    });

    it("handles resources/read method", async () => {
      const res = await sendRequest({
        id: 6,
        method: "resources/read",
        params: { uri: "af-motion://visual-styles" },
      });
      expect(res.error).toBeUndefined();
      const result = res.result as Record<string, any>;
      expect(result.contents[0].uri).toBe("af-motion://visual-styles");
      const styles = JSON.parse(result.contents[0].text);
      expect(styles.length).toBe(19);
    });

    it("handles prompts/list method", async () => {
      const res = await sendRequest({ id: 7, method: "prompts/list" });
      expect(res.error).toBeUndefined();
      const result = res.result as Record<string, any>;
      expect(result.prompts.length).toBe(6);
    });

    it("handles prompts/get method", async () => {
      const res = await sendRequest({
        id: 8,
        method: "prompts/get",
        params: {
          name: "react-animation-system",
          arguments: { componentType: "button" },
        },
      });
      expect(res.error).toBeUndefined();
      const result = res.result as Record<string, any>;
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it("returns JSON-RPC error -32601 for unsupported methods", async () => {
      const res = await sendRequest({ id: 9, method: "unsupported/method" });
      expect(res.error).toBeDefined();
      expect(res.error?.code).toBe(-32601);
      expect(res.error?.message).toContain("Method not found");
    });

    it("returns JSON-RPC error -32600 for invalid JSON-RPC version", async () => {
      const invalidReq = {
        jsonrpc: "1.0",
        id: 10,
        method: "ping",
      } as unknown as JSONRPCRequest;
      await transport.sendToServer(invalidReq);
      const res = responses.find((r) => r.id === 10);
      expect(res?.error?.code).toBe(-32600);
    });

    it("returns JSON-RPC error -32602 for tools/call without tool name", async () => {
      const res = await sendRequest({
        id: 11,
        method: "tools/call",
        params: {},
      });
      expect(res.error?.code).toBe(-32602);
      expect(res.error?.message).toContain("Missing tool name");
    });

    it("rejects calls after server is closed", async () => {
      await server.close();
      await expect(
        transport.sendToServer({ jsonrpc: "2.0", id: 12, method: "ping" })
      ).rejects.toThrow("Transport is closed");
    });
  });

  describe("StdioTransport", () => {
    it("can be instantiated and closed safely", async () => {
      const stdio = new StdioTransport();
      expect(stdio).toBeDefined();
      await stdio.close();
      await expect(
        stdio.send({ jsonrpc: "2.0", id: 1, result: {} })
      ).rejects.toThrow("StdioTransport is closed");
    });
  });
});
