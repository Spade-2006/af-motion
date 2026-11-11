import React, { useEffect, useMemo, useState } from "react";
import {
  aiSceneGenerationEngine,
  designToMotionEngine,
  evaluateMotionQuality,
  generateMotionRecommendations,
  listWorkflowTemplates,
} from "af-motion/catalogue";
import { DemoWorkspace } from "../components/DemoWorkspace";
import {
  ControlSection,
  SelectControl,
  SliderControl,
  ToggleControl,
} from "../components/ControlPanel";
import { Badge } from "@/components/ui/Badge";
import type { DemoComponentProps } from "../types";
import { Cpu, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";

type AILabTab = "intelligence" | "design-to-motion" | "scene-gen" | "workflows";

export const AILaboratoryDemo: React.FC<DemoComponentProps> = ({
  resetNonce,
  onCodeChange,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState<AILabTab>("intelligence");

  // 1. Intelligence audit controls
  const [auditDuration, setAuditDuration] = useState(450);
  const [includeLayoutProp, setIncludeLayoutProp] = useState(false);

  // 2. Design-to-Motion controls
  const [dtmPrompt, setDtmPrompt] = useState("sleek dashboard card entrance with subtle hover lift");
  const [dtmStyle, setDtmStyle] = useState("minimal");

  // 3. Scene Generation controls
  const [scenePrompt, setScenePrompt] = useState("futuristic orbital hero stage with ambient particles");
  const [sceneCategory, setSceneCategory] = useState("hero");

  // 4. Workflows controls
  const workflows = useMemo(() => listWorkflowTemplates(), []);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(
    workflows[0]?.id ?? "motion-quality-audit"
  );

  useEffect(() => {
    if (resetNonce === 0) return;
    setAuditDuration(450);
    setIncludeLayoutProp(false);
    setDtmPrompt("sleek dashboard card entrance with subtle hover lift");
    setDtmStyle("minimal");
    setScenePrompt("futuristic orbital hero stage with ambient particles");
    setSceneCategory("hero");
  }, [resetNonce]);

  // Execute deterministic Motion Intelligence evaluation
  const qualityReport = useMemo(() => {
    const config = {
      duration: auditDuration,
      easing: "easeOutExpo",
      properties: includeLayoutProp
        ? { width: ["100px", "260px"], opacity: [0, 1] }
        : { opacity: [0, 1], transform: ["translate3d(0, 20px, 0)", "translate3d(0, 0, 0)"] },
    };
    const input = { configuration: config as any };
    const quality = evaluateMotionQuality(input as any);
    const recommendations = generateMotionRecommendations(
      input as any,
      quality.findings
    );
    return { quality, recommendations };
  }, [auditDuration, includeLayoutProp]);

  // Execute deterministic Design-to-Motion
  const dtmResult = useMemo(() => {
    return designToMotionEngine.generateSync({
      prompt: dtmPrompt,
      style: dtmStyle,
    } as any);
  }, [dtmPrompt, dtmStyle]);

  // Execute deterministic Scene Generation
  const sceneResult = useMemo(() => {
    return aiSceneGenerationEngine.generateSync({
      naturalLanguage: scenePrompt,
      specification: { category: sceneCategory as any },
    });
  }, [scenePrompt, sceneCategory]);

  // Execute deterministic Agent Workflow Plan
  const activeWorkflowPlan = useMemo(() => {
    const wf = workflows.find((w) => w.id === selectedWorkflowId) ?? workflows[0];
    if (!wf) return null;
    return {
      workflow: wf,
      plan: wf.createPlan(wf.defaultGoal),
    };
  }, [workflows, selectedWorkflowId]);

  // Emit Code Inspector output
  useEffect(() => {
    let code = "";
    if (activeTab === "intelligence") {
      code = `import { evaluateMotionQuality, generateMotionRecommendations } from "af-motion/catalogue";

const config = {
  duration: ${auditDuration},
  easing: "easeOutExpo",
  properties: ${
    includeLayoutProp
      ? '{ width: ["100px", "260px"], opacity: [0, 1] }'
      : '{ opacity: [0, 1], transform: ["translate3d(0, 20px, 0)", "translate3d(0, 0, 0)"] }'
  },
};

const input = { configuration: config };
const quality = evaluateMotionQuality(input);
const recommendations = generateMotionRecommendations(input, quality.findings);`;
      onStatusChange?.(`Deterministic AI · Score: ${qualityReport.quality.scores.overall} (${qualityReport.quality.grade})`);
    } else if (activeTab === "design-to-motion") {
      code = `import { designToMotionEngine } from "af-motion/catalogue";

const result = designToMotionEngine.generateSync({
  prompt: "${dtmPrompt}",
  style: "${dtmStyle}",
});`;
      onStatusChange?.(`Design-to-Motion · ${dtmResult.analysis?.analyzedElements?.length ?? 0} elements`);
    } else if (activeTab === "scene-gen") {
      code = `import { aiSceneGenerationEngine } from "af-motion/catalogue";

const scene = aiSceneGenerationEngine.generateSync({
  naturalLanguage: "${scenePrompt}",
  specification: { category: "${sceneCategory}" },
});`;
      onStatusChange?.(`Scene Generator · Offline Deterministic`);
    } else {
      code = `import { listWorkflowTemplates } from "af-motion/catalogue";

const template = listWorkflowTemplates().find((w) => w.id === "${selectedWorkflowId}");
const plan = template?.createPlan(template.defaultGoal);`;
      onStatusChange?.(`Agent Workflow · ${activeWorkflowPlan?.plan?.tasks?.length ?? 0} tasks`);
    }
    onCodeChange(code);
  }, [
    activeTab,
    auditDuration,
    includeLayoutProp,
    dtmPrompt,
    dtmStyle,
    scenePrompt,
    sceneCategory,
    selectedWorkflowId,
    qualityReport,
    dtmResult,
    activeWorkflowPlan,
    onCodeChange,
    onStatusChange,
  ]);

  return (
    <DemoWorkspace
      controlsTitle="Offline Deterministic AI"
      stage={
        <div className="flex-1 flex flex-col gap-4">
          {/* Sub-Tabs & Offline Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "intelligence", label: "Motion Intelligence" },
                  { id: "design-to-motion", label: "Design-to-Motion" },
                  { id: "scene-gen", label: "Scene Generation" },
                  { id: "workflows", label: "Agent Workflows" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white"
                      : "bg-white/[0.04] text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Badge variant="emerald" size="sm">
              Offline · Deterministic
            </Badge>
          </div>

          {/* 1. Motion Intelligence View */}
          {activeTab === "intelligence" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-[#090b12] border border-white/[0.08] p-4 flex flex-col justify-center items-center text-center">
                  <span className="font-mono text-[10px] text-slate-500 uppercase">Overall Score</span>
                  <span className="text-3xl font-extrabold text-white mt-1">
                    {qualityReport.quality.scores.overall}
                  </span>
                </div>
                <div className="rounded-xl bg-[#090b12] border border-white/[0.08] p-4 flex flex-col justify-center items-center text-center">
                  <span className="font-mono text-[10px] text-slate-500 uppercase">Grade</span>
                  <span className="text-3xl font-extrabold text-cyan-300 mt-1">
                    {qualityReport.quality.grade}
                  </span>
                </div>
                <div className="rounded-xl bg-[#090b12] border border-white/[0.08] p-4 flex flex-col justify-center items-center text-center">
                  <span className="font-mono text-[10px] text-slate-500 uppercase">Performance</span>
                  <span className="text-3xl font-extrabold text-indigo-300 mt-1">
                    {qualityReport.quality.scores.performance}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-[#090b12] border border-white/[0.08] p-4 space-y-2.5">
                <p className="text-xs text-slate-300">{qualityReport.quality.summary}</p>
                {qualityReport.recommendations.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    {qualityReport.recommendations.slice(0, 3).map((rec: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{rec.rationale || rec.message || JSON.stringify(rec)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 pt-2 border-t border-white/[0.06]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Zero anti-patterns or layout-thrashing issues detected.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Design-to-Motion View */}
          {activeTab === "design-to-motion" && (
            <div className="space-y-3">
              <div className="rounded-xl bg-[#090b12] border border-white/[0.08] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] text-cyan-300">
                    Analyzed UI Elements ({dtmResult.analysis?.analyzedElements?.length ?? 0})
                  </span>
                  <Badge variant="glow" size="sm">
                    Style: {dtmStyle}
                  </Badge>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                  {JSON.stringify(
                    {
                      elements: dtmResult.analysis?.analyzedElements?.map((e: any) => ({
                        id: e.id,
                        type: e.type,
                        role: e.role,
                        suggestedEntrance: e.suggestedEntrance,
                      })),
                      validationValid: dtmResult.validation?.isValid,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}

          {/* 3. Scene Generation View */}
          {activeTab === "scene-gen" && (
            <div className="rounded-xl bg-[#090b12] border border-white/[0.08] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-cyan-300">
                  Subject: {sceneResult.understanding?.primarySubject}
                </span>
                <Badge variant="cyan" size="sm">
                  {sceneResult.understanding?.category}
                </Badge>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-52">
                {JSON.stringify(
                  {
                    supportingElements: sceneResult.understanding?.supportingElements,
                    scene3dObjects: sceneResult.scene3dSpec?.objects?.length ?? 0,
                    validationValid: sceneResult.validation?.isValid,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}

          {/* 4. Agent Workflows View */}
          {activeTab === "workflows" && activeWorkflowPlan && (
            <div className="space-y-3">
              <div className="rounded-xl bg-[#090b12] border border-white/[0.08] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    {activeWorkflowPlan.workflow.name}
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Approval Gated
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {activeWorkflowPlan.workflow.description}
                </p>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {activeWorkflowPlan.plan.tasks.map((task: any, i: number) => (
                  <div
                    key={task.id || i}
                    className="rounded-lg bg-[#0a0d16] border border-white/[0.06] p-3 flex items-start justify-between gap-3"
                  >
                    <div>
                      <span className="font-mono text-[11px] text-cyan-300 block">
                        Step {i + 1} · {task.assignedAgentId}
                      </span>
                      <span className="text-xs text-slate-300">{task.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }
      footer={
        <div className="flex flex-wrap justify-between font-mono text-[11px] text-slate-400">
          <span>Deterministic Local Execution · Zero External LLM Calls</span>
          <span>Safe Configuration Synthesis · No eval()</span>
        </div>
      }
      controls={
        <>
          {activeTab === "intelligence" && (
            <ControlSection title="Audit Input Config">
              <SliderControl
                id="ai-dur"
                label="Duration"
                value={auditDuration}
                min={50}
                max={2500}
                step={50}
                unit="ms"
                onChange={setAuditDuration}
              />
              <ToggleControl
                id="ai-layout"
                label="Simulate Layout Property (width)"
                checked={includeLayoutProp}
                onChange={setIncludeLayoutProp}
              />
            </ControlSection>
          )}

          {activeTab === "design-to-motion" && (
            <ControlSection title="Design Spec Input">
              <div className="space-y-1.5">
                <label htmlFor="dtm-prompt" className="text-xs font-medium text-slate-300">
                  Prompt Description
                </label>
                <textarea
                  id="dtm-prompt"
                  rows={3}
                  value={dtmPrompt}
                  onChange={(e) => setDtmPrompt(e.target.value)}
                  className="w-full rounded-lg bg-[#0d1018] border border-white/[0.1] p-2 text-xs text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              </div>
              <SelectControl
                id="dtm-style"
                label="Visual Design Style"
                value={dtmStyle}
                options={[
                  { value: "minimal", label: "Minimal" },
                  { value: "glassmorphism", label: "Glassmorphism" },
                  { value: "cyberpunk", label: "Cyberpunk" },
                  { value: "editorial", label: "Editorial" },
                ]}
                onChange={setDtmStyle}
              />
            </ControlSection>
          )}

          {activeTab === "scene-gen" && (
            <ControlSection title="Scene Specification">
              <div className="space-y-1.5">
                <label htmlFor="scene-prompt" className="text-xs font-medium text-slate-300">
                  Scene Goal
                </label>
                <textarea
                  id="scene-prompt"
                  rows={3}
                  value={scenePrompt}
                  onChange={(e) => setScenePrompt(e.target.value)}
                  className="w-full rounded-lg bg-[#0d1018] border border-white/[0.1] p-2 text-xs text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              </div>
              <SelectControl
                id="scene-cat"
                label="Scene Category"
                value={sceneCategory}
                options={[
                  { value: "hero", label: "Hero Stage" },
                  { value: "dashboard", label: "Dashboard" },
                  { value: "showcase", label: "Showcase" },
                ]}
                onChange={setSceneCategory}
              />
            </ControlSection>
          )}

          {activeTab === "workflows" && (
            <ControlSection title="Workflow Templates">
              <SelectControl
                id="wf-select"
                label="Select Approved Workflow"
                value={selectedWorkflowId}
                options={workflows.map((w) => ({ value: w.id, label: w.name }))}
                onChange={setSelectedWorkflowId}
              />
            </ControlSection>
          )}
        </>
      }
    />
  );
};

export default AILaboratoryDemo;
