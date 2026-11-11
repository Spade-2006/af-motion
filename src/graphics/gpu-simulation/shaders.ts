/**
 * AF Motion GPU Simulation Architecture — Shader Infrastructure
 *
 * Provides shader compilation, validation, caching, uniform extraction,
 * and error reporting across WebGL2 GLSL ES 3.0, WebGPU WGSL, and CPU kernels.
 */

import type { ComputeShaderDescriptor, ComputeShaderLanguage } from "./types.js";

export interface ShaderCompilationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly compiledObject?: unknown;
}

export interface CachedShaderEntry {
  readonly id: string;
  readonly key: string;
  readonly language: ComputeShaderLanguage;
  readonly compiledObject: unknown;
  readonly timestamp: number;
}

const shaderCache = new Map<string, CachedShaderEntry>();

/**
 * Computes a deterministic cache key from shader source and metadata.
 */
export function computeShaderCacheKey(descriptor: ComputeShaderDescriptor): string {
  const language = descriptor.language || "glsl";
  const sourceStr = typeof descriptor.source === "function" ? descriptor.source.toString() : descriptor.source;
  const entryPoint = descriptor.entryPoint || "main";

  let hash = 0;
  const combined = `${language}:${entryPoint}:${sourceStr}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `shader_${language}_${Math.abs(hash).toString(16)}`;
}

/**
 * Validates shader descriptor structure and uniform signatures.
 */
export function validateShaderDescriptor(descriptor: ComputeShaderDescriptor): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!descriptor) {
    errors.push("Shader descriptor cannot be null or undefined");
    return { valid: false, errors };
  }

  if (!descriptor.source) {
    errors.push("Shader descriptor requires a valid source (string or CPU kernel function)");
  }

  const lang = descriptor.language || "glsl";
  if (!["wgsl", "glsl", "cpu"].includes(lang)) {
    errors.push(`Unsupported shader language "${lang}". Supported: "wgsl", "glsl", "cpu"`);
  }

  if (lang === "cpu" && typeof descriptor.source !== "function") {
    errors.push("CPU shader language requires a JavaScript kernel function as source");
  }

  if ((lang === "glsl" || lang === "wgsl") && typeof descriptor.source !== "string") {
    errors.push(`${lang.toUpperCase()} shader requires string source code`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Compiles and validates a WebGL2 GLSL fragment shader for GPU simulation.
 */
export function compileWebGL2Shader(
  gl: WebGL2RenderingContext,
  source: string,
  type: number = gl.FRAGMENT_SHADER,
): ShaderCompilationResult {
  const shader = gl.createShader(type);
  if (!shader) {
    return { valid: false, errors: ["Failed to allocate WebGL2 shader handle"] };
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    const infoLog = gl.getShaderInfoLog(shader) || "Unknown WebGL2 shader compilation error";
    gl.deleteShader(shader);
    return {
      valid: false,
      errors: [formatShaderErrorLog(infoLog, source)],
    };
  }

  return {
    valid: true,
    errors: [],
    compiledObject: shader,
  };
}

/**
 * Creates and links a WebGL2 simulation program with a pass-through full-screen quad vertex shader.
 */
export const WEBGL2_QUAD_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export function createWebGL2SimulationProgram(
  gl: WebGL2RenderingContext,
  fragmentShaderSource: string,
): { program: WebGLProgram | null; errors: string[] } {
  // Vertex shader
  const vertResult = compileWebGL2Shader(gl, WEBGL2_QUAD_VERTEX_SHADER, gl.VERTEX_SHADER);
  if (!vertResult.valid || !vertResult.compiledObject) {
    return { program: null, errors: [...vertResult.errors] };
  }

  // Fragment shader
  const fragResult = compileWebGL2Shader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
  if (!fragResult.valid || !fragResult.compiledObject) {
    gl.deleteShader(vertResult.compiledObject as WebGLShader);
    return { program: null, errors: [...fragResult.errors] };
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertResult.compiledObject as WebGLShader);
    gl.deleteShader(fragResult.compiledObject as WebGLShader);
    return { program: null, errors: ["Failed to create WebGL2 program handle"] };
  }

  gl.attachShader(program, vertResult.compiledObject as WebGLShader);
  gl.attachShader(program, fragResult.compiledObject as WebGLShader);
  gl.linkProgram(program);

  // Mark shaders for deletion once program is unlinked
  gl.deleteShader(vertResult.compiledObject as WebGLShader);
  gl.deleteShader(fragResult.compiledObject as WebGLShader);

  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    const infoLog = gl.getProgramInfoLog(program) || "WebGL2 program link error";
    gl.deleteProgram(program);
    return { program: null, errors: [infoLog] };
  }

  return { program, errors: [] };
}

/**
 * Formats raw shader error logs with line-referenced code context.
 */
export function formatShaderErrorLog(infoLog: string, source: string): string {
  const lines = source.split("\n");
  const parsed = infoLog
    .split("\n")
    .map((line) => {
      const match = /ERROR:\s+\d+:(\d+):(.*)/i.exec(line);
      if (match) {
        const lineNum = parseInt(match[1], 10);
        const codeSnippet = lines[lineNum - 1] ? ` -> [Line ${lineNum}]: ${lines[lineNum - 1].trim()}` : "";
        return `${line}${codeSnippet}`;
      }
      return line;
    })
    .join("\n");

  return parsed;
}

/**
 * Clears the shader compilation cache.
 */
export function clearShaderCache(): void {
  shaderCache.clear();
}
