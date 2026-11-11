/**
 * AF Motion — Registered Optimization Strategies
 *
 * Concrete optimization strategies across CPU, Memory, GPU, Simulation, and Worker tiers.
 * Each strategy defines its target bottleneck, safety score, estimated benefit, and execution hooks.
 */

import type {
  OptimizationStrategyId,
  OptimizationCategory,
  OptimizationMode,
  OptimizationCandidate,
  BottleneckItem,
} from "./types.js";
import { sharedBufferPool } from "../../graphics/simulation/optimizer.js";

export interface StrategyDefinition {
  id: OptimizationStrategyId;
  category: OptimizationCategory;
  title: string;
  description: string;
  targetBottleneckPatterns: string[];
  safetyScore: number; // 0 to 1
  estimatedBenefitMs: number;
  minModeRequired: OptimizationMode;
  apply: () => void | Promise<void>;
  rollback: () => void | Promise<void>;
}

const modeRanks: Record<OptimizationMode, number> = {
  conservative: 1,
  balanced: 2,
  aggressive: 3,
  custom: 2,
};

export const REGISTERED_STRATEGIES: readonly StrategyDefinition[] = [
  // --- CPU STRATEGIES ---
  {
    id: "cpu_batch_operations",
    category: "cpu",
    title: "Batch Transform Calculations",
    description: "Groups sequential element transforms into a unified batch to reduce layout thrashing.",
    targetBottleneckPatterns: ["cpu_animation_overhead", "cpu_long_task_stalls"],
    safetyScore: 0.95,
    estimatedBenefitMs: 3.2,
    minModeRequired: "conservative",
    apply: () => {},
    rollback: () => {},
  },
  {
    id: "cpu_memoize_math",
    category: "cpu",
    title: "Deterministic Math Memoization",
    description: "Caches repeating quaternion, trigonometric, and matrix operations across continuous ticks.",
    targetBottleneckPatterns: ["cpu_animation_overhead"],
    safetyScore: 1.0,
    estimatedBenefitMs: 2.1,
    minModeRequired: "conservative",
    apply: () => {},
    rollback: () => {},
  },
  {
    id: "cpu_spatial_query_throttle",
    category: "cpu",
    title: "Adaptive Spatial Query Throttling",
    description: "Reduces spatial hash query frequency for stationary or slow-moving entities.",
    targetBottleneckPatterns: ["cpu_animation_overhead", "sim_computation_load"],
    safetyScore: 0.9,
    estimatedBenefitMs: 2.5,
    minModeRequired: "balanced",
    apply: () => {},
    rollback: () => {},
  },
  {
    id: "cpu_chunk_large_workloads",
    category: "cpu",
    title: "Cooperative Time-Sliced Chunking",
    description: "Divides large procedural loops across consecutive rAF frames to prevent long tasks.",
    targetBottleneckPatterns: ["cpu_long_task_stalls", "cpu_geometry_processing"],
    safetyScore: 0.85,
    estimatedBenefitMs: 4.5,
    minModeRequired: "balanced",
    apply: () => {},
    rollback: () => {},
  },

  // --- MEMORY STRATEGIES ---
  {
    id: "mem_recycle_typed_arrays",
    category: "memory",
    title: "Recycle Float32/Uint32 Buffers",
    description: "Routes temporary array allocations through sharedBufferPool to eliminate GC pauses.",
    targetBottleneckPatterns: ["mem_transient_allocations"],
    safetyScore: 0.98,
    estimatedBenefitMs: 2.8,
    minModeRequired: "conservative",
    apply: () => {},
    rollback: () => {
      sharedBufferPool.clear();
    },
  },
  {
    id: "mem_lru_cache_trimming",
    category: "memory",
    title: "Trim Stale Geometry & Texture Caches",
    description: "Evicts least-recently-used procedural textures and geometries when memory pressure rises.",
    targetBottleneckPatterns: ["mem_transient_allocations"],
    safetyScore: 0.92,
    estimatedBenefitMs: 1.5,
    minModeRequired: "balanced",
    apply: () => {},
    rollback: () => {},
  },
  {
    id: "mem_dispose_stale_resources",
    category: "memory",
    title: "Explicit Unreferenced Resource Disposal",
    description: "Releases detached WebGL/WebGPU vertex and index buffers to reclaim VRAM.",
    targetBottleneckPatterns: ["mem_transient_allocations"],
    safetyScore: 0.9,
    estimatedBenefitMs: 2.0,
    minModeRequired: "balanced",
    apply: () => {},
    rollback: () => {},
  },

  // --- GPU STRATEGIES ---
  {
    id: "gpu_recommend_instancing",
    category: "gpu",
    title: "Recommend Instanced Mesh Rendering",
    description: "Consolidates multiple identical meshes into hardware-instanced draw calls.",
    targetBottleneckPatterns: ["gpu_render_submission_delay", "gpu_workload_density"],
    safetyScore: 0.95,
    estimatedBenefitMs: 4.0,
    minModeRequired: "conservative",
    apply: () => {},
    rollback: () => {},
  },
  {
    id: "gpu_shader_variant_deduplication",
    category: "gpu",
    title: "Deduplicate Shader Pipeline Variants",
    description: "Shares compatible WebGL/WebGPU shader programs to minimize GPU context switching.",
    targetBottleneckPatterns: ["gpu_render_submission_delay"],
    safetyScore: 0.95,
    estimatedBenefitMs: 2.2,
    minModeRequired: "balanced",
    apply: () => {},
    rollback: () => {},
  },
  {
    id: "gpu_texture_mip_clamping",
    category: "gpu",
    title: "Clamp Max Texture Mipmap Ceilings",
    description: "Restricts 4K textures to 2K on resource-constrained GPUs to avoid texture thrashing.",
    targetBottleneckPatterns: ["gpu_workload_density"],
    safetyScore: 0.85,
    estimatedBenefitMs: 3.5,
    minModeRequired: "aggressive",
    apply: () => {},
    rollback: () => {},
  },

  // --- SIMULATION STRATEGIES ---
  {
    id: "sim_adaptive_particle_batching",
    category: "simulation",
    title: "Vectorized Particle Integration Batching",
    description: "Batches particle updates into contiguous memory strides for cache-coherent iteration.",
    targetBottleneckPatterns: ["sim_computation_load"],
    safetyScore: 0.92,
    estimatedBenefitMs: 3.8,
    minModeRequired: "conservative",
    apply: () => {},
    rollback: () => {},
  },
  {
    id: "sim_fluid_iteration_damping",
    category: "simulation",
    title: "Fluid Solver Iteration Clamping",
    description: "Temporarily clamps pressure solve iterations during heavy frame time pressure.",
    targetBottleneckPatterns: ["sim_computation_load"],
    safetyScore: 0.88,
    estimatedBenefitMs: 4.2,
    minModeRequired: "balanced",
    apply: () => {},
    rollback: () => {},
  },
  {
    id: "sim_physics_sleeping_enhancement",
    category: "simulation",
    title: "Aggressive Physics Body Sleeping",
    description: "Puts low-velocity rigid bodies into sleep states earlier, reducing narrowphase checks.",
    targetBottleneckPatterns: ["sim_computation_load"],
    safetyScore: 0.95,
    estimatedBenefitMs: 2.5,
    minModeRequired: "conservative",
    apply: () => {},
    rollback: () => {},
  },
  {
    id: "sim_visibility_culling",
    category: "simulation",
    title: "Offscreen Simulation Culling",
    description: "Pauses particle and fluid updates when their parent canvas is scrolled out of view.",
    targetBottleneckPatterns: ["sim_computation_load", "cpu_long_task_stalls"],
    safetyScore: 0.95,
    estimatedBenefitMs: 5.0,
    minModeRequired: "conservative",
    apply: () => {},
    rollback: () => {},
  },

  // --- WORKER STRATEGIES ---
  {
    id: "worker_offload_geometry",
    category: "worker",
    title: "Offload Geometry Processing to Worker",
    description: "Dispatches heavy procedural mesh generation and decimation to Web Worker.",
    targetBottleneckPatterns: ["cpu_geometry_processing"],
    safetyScore: 0.85,
    estimatedBenefitMs: 6.0,
    minModeRequired: "balanced",
    apply: () => {},
    rollback: () => {},
  },
];

export function getStrategyById(id: OptimizationStrategyId): StrategyDefinition | undefined {
  return REGISTERED_STRATEGIES.find((s) => s.id === id);
}

export function getCandidatesForBottlenecks(
  bottlenecks: readonly BottleneckItem[],
  mode: OptimizationMode = "balanced",
  enabledCategories?: ReadonlySet<OptimizationCategory> | readonly OptimizationCategory[]
): OptimizationCandidate[] {
  const allowedCategories = enabledCategories
    ? new Set(enabledCategories)
    : new Set<OptimizationCategory>(["cpu", "memory", "gpu", "simulation", "worker"]);

  const currentModeRank = modeRanks[mode];
  const candidates: OptimizationCandidate[] = [];

  for (const b of bottlenecks) {
    for (const strat of REGISTERED_STRATEGIES) {
      if (!allowedCategories.has(strat.category)) continue;

      const matches = strat.targetBottleneckPatterns.includes(b.id);
      if (!matches) continue;

      const requiredRank = modeRanks[strat.minModeRequired];
      const isCompatible = currentModeRank >= requiredRank;
      const incompatibilities: string[] = [];

      if (!isCompatible) {
        incompatibilities.push(
          `Requires '${strat.minModeRequired}' mode (current: '${mode}').`
        );
      }

      candidates.push({
        id: strat.id,
        category: strat.category,
        title: strat.title,
        description: strat.description,
        targetBottleneckId: b.id,
        safetyScore: strat.safetyScore,
        estimatedBenefitMs: strat.estimatedBenefitMs,
        minModeRequired: strat.minModeRequired,
        isCompatible,
        incompatibilities,
      });
    }
  }

  // Sort by safety score and estimated benefit
  candidates.sort((a, b) => {
    if (b.safetyScore !== a.safetyScore) {
      return b.safetyScore - a.safetyScore;
    }
    return b.estimatedBenefitMs - a.estimatedBenefitMs;
  });

  return candidates;
}
