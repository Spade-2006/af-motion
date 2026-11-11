import React, { useState, useMemo } from "react";
import type { UnifiedCompositionState } from "../../types/unified-playground.js";
import {
  agentRegistry,
  safeToolRegistry,
  listWorkflowTemplates,
  getWorkflowTemplate,
  workflowExecutionEngine,
  taskPlanner,
  collaborationPlanner,
  multiAgentOrchestrator,
  listCollaborationWorkflows,
  getCollaborationWorkflow,
  conflictResolver,
  type AgentMetadata,
  type AgentTask,
  type TaskPlan,
  type WorkflowExecutionResult,
  type WorkflowStatus,
  type WorkflowAuditEntry,
  type CollaborationPlan,
  type CollaborationTask,
  type MultiAgentDeliverable,
  type OrchestrationStrategy,
  type ConflictRecord,
  type AgentMessage,
  type QualityGateCheck,
} from "../../../src/core/agent-workflows/index.js";

interface AIAgentsPanelProps {
  state: UnifiedCompositionState;
  onChange: (updater: (prev: UnifiedCompositionState) => UnifiedCompositionState) => void;
}

export const AIAgentsPanel: React.FC<AIAgentsPanelProps> = ({ state, onChange }) => {
  // Navigation mode: "workflows" (Prompt 144 single-agent) vs "collaboration" (Prompt 145 multi-agent team)
  const [panelMode, setPanelMode] = useState<"workflows" | "collaboration">("collaboration");

  const templates = useMemo(() => listWorkflowTemplates(), []);
  const collabWorkflows = useMemo(() => listCollaborationWorkflows(), []);
  const agents = useMemo(() => agentRegistry.list(), []);
  const tools = useMemo(() => safeToolRegistry.list(), []);

  // -------------------------------------------------------------------------
  // Prompt 144 State
  // -------------------------------------------------------------------------
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("motion-quality-audit");
  const [goalText, setGoalText] = useState<string>(() => {
    return templates[0]?.defaultGoal || "Audit motion configuration for quality and accessibility.";
  });
  const [requireApproval, setRequireApproval] = useState<boolean>(true);
  const [plan, setPlan] = useState<TaskPlan | null>(() => {
    const tmpl = templates[0];
    return tmpl ? tmpl.createPlan(tmpl.defaultGoal) : null;
  });
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("pending");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<WorkflowExecutionResult | null>(null);
  const [auditLogs, setAuditLogs] = useState<WorkflowAuditEntry[]>([]);
  const [activeResultTab, setActiveResultTab] = useState<"summary" | "output" | "logs">("summary");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // -------------------------------------------------------------------------
  // Prompt 145 Multi-Agent Collaboration State
  // -------------------------------------------------------------------------
  const [selectedCollabId, setSelectedCollabId] = useState<string>("complete-design-to-motion");
  const [collabGoal, setCollabGoal] = useState<string>(() => {
    return collabWorkflows[0]?.defaultGoal || "Transform design layout into validated motion choreography with Motion DNA.";
  });
  const [selectedStrategy, setSelectedStrategy] = useState<OrchestrationStrategy>("review-and-refine");
  const [collabPlan, setCollabPlan] = useState<CollaborationPlan | null>(() => {
    const wf = collabWorkflows[0];
    return wf ? wf.createPlan(wf.defaultGoal) : null;
  });
  const [collabStatus, setCollabStatus] = useState<WorkflowStatus>("pending");
  const [collabProgress, setCollabProgress] = useState<number>(0);
  const [collabDeliverable, setCollabDeliverable] = useState<MultiAgentDeliverable | null>(null);
  const [collabMessages, setCollabMessages] = useState<AgentMessage[]>([]);
  const [collabConflicts, setCollabConflicts] = useState<ConflictRecord[]>([]);
  const [collabActiveTab, setCollabActiveTab] = useState<"waves" | "messages" | "conflicts" | "quality" | "deliverable">("waves");

  // Handle template selection (Prompt 144)
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = getWorkflowTemplate(templateId);
    if (tmpl) {
      setGoalText(tmpl.defaultGoal);
      const newPlan = tmpl.createPlan(tmpl.defaultGoal);
      setPlan(newPlan);
      setWorkflowStatus("pending");
      setExecutionResult(null);
    }
  };

  // Handle collaboration selection (Prompt 145)
  const handleSelectCollabWorkflow = (collabId: string) => {
    setSelectedCollabId(collabId);
    const wf = getCollaborationWorkflow(collabId);
    if (wf) {
      setCollabGoal(wf.defaultGoal);
      setSelectedStrategy(wf.strategy);
      const newPlan = wf.createPlan(wf.defaultGoal);
      setCollabPlan(newPlan);
      setCollabStatus("pending");
      setCollabProgress(0);
      setCollabDeliverable(null);
      setCollabMessages([]);
      setCollabConflicts([]);
    }
  };

  // Run Multi-Agent Orchestration
  const handleRunCollaboration = async () => {
    if (!collabPlan) return;
    setIsExecuting(true);
    setCollabStatus("running");
    setCollabProgress(10);

    try {
      const deliverableResult = await multiAgentOrchestrator.orchestrate(collabPlan, {
        strategy: selectedStrategy,
        onProgress: (p) => setCollabProgress(p),
        onMessage: (msg) => setCollabMessages((prev) => [...prev, msg]),
        onConflict: (conf) => setCollabConflicts((prev) => [...prev, conf]),
      });

      setCollabDeliverable(deliverableResult);
      setCollabStatus(deliverableResult.status);
      setCollabConflicts([...deliverableResult.conflicts]);
      setCollabMessages([...deliverableResult.messageAudit]);
      setCollabProgress(100);
    } catch (err) {
      setCollabStatus("failed");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleResolveConflictManually = (conflictId: string) => {
    setCollabConflicts((prev) =>
      prev.map((c) => {
        if (c.id === conflictId) {
          return conflictResolver.resolveConflict(c, "rule_based");
        }
        return c;
      })
    );
  };

  return (
    <div
      className="ai-agents-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        color: "#F8FAFC",
        fontSize: "0.85rem",
      }}
    >
      {/* 1. Header & Mode Switcher */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ margin: "0 0 2px 0", fontSize: "1.05rem", color: "#38BDF8", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🤖</span> AI Agents & Orchestration
            </h3>
            <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
              Phase 18: Individual Workflows (P144) & Multi-Agent Collaboration (P145)
            </span>
          </div>

          <div style={{ display: "flex", gap: "4px", background: "rgba(15, 23, 42, 0.8)", padding: "3px", borderRadius: "6px" }}>
            <button
              type="button"
              onClick={() => setPanelMode("collaboration")}
              style={{
                padding: "4px 10px",
                borderRadius: "4px",
                border: "none",
                background: panelMode === "collaboration" ? "#38BDF8" : "transparent",
                color: panelMode === "collaboration" ? "#0F172A" : "#94A3B8",
                fontWeight: 700,
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              👥 Multi-Agent Team
            </button>
            <button
              type="button"
              onClick={() => setPanelMode("workflows")}
              style={{
                padding: "4px 10px",
                borderRadius: "4px",
                border: "none",
                background: panelMode === "workflows" ? "#38BDF8" : "transparent",
                color: panelMode === "workflows" ? "#0F172A" : "#94A3B8",
                fontWeight: 700,
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              ⚡ Single Workflow
            </button>
          </div>
        </div>
      </div>

      {/* 2. Registered Agents Deck */}
      <div>
        <label style={{ display: "block", fontSize: "0.72rem", color: "#94A3B8", marginBottom: "6px", fontWeight: 600 }}>
          ACTIVE SPECIALIZED AGENT SQUAD ({agents.length})
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "6px" }}>
          {agents.map((ag) => (
            <div
              key={ag.id}
              style={{
                padding: "7px 8px",
                borderRadius: "6px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "1rem" }}>{ag.icon || "⚙️"}</span>
                <span style={{ fontWeight: 600, fontSize: "0.73rem", color: "#F1F5F9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ag.name}
                </span>
              </div>
              <span style={{ fontSize: "0.65rem", color: "#64748B" }}>
                {ag.capabilities.length} capabilities
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MULTI-AGENT COLLABORATION MODE (PROMPT 145) */}
      {panelMode === "collaboration" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Workflow & Strategy Selector */}
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "#94A3B8", marginBottom: "4px", fontWeight: 600 }}>
                  COLLABORATION WORKFLOW
                </label>
                <select
                  value={selectedCollabId}
                  onChange={(e) => handleSelectCollabWorkflow(e.target.value)}
                  disabled={isExecuting}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: "#0F172A",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#F8FAFC",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  {collabWorkflows.map((wf) => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "#94A3B8", marginBottom: "4px", fontWeight: 600 }}>
                  ORCHESTRATION STRATEGY
                </label>
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value as OrchestrationStrategy)}
                  disabled={isExecuting}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: "#0F172A",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#F8FAFC",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  <option value="review-and-refine">Review-and-Refine (Feedback Loop)</option>
                  <option value="hierarchical">Hierarchical (Coordinator Delegation)</option>
                  <option value="pipeline">Pipeline (Sequential Stages)</option>
                  <option value="parallel">Parallel (Simultaneous Waves)</option>
                  <option value="sequential">Sequential (Chained Handoffs)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.72rem", color: "#94A3B8", marginBottom: "4px", fontWeight: 600 }}>
                COLLABORATIVE GOAL
              </label>
              <textarea
                value={collabGoal}
                onChange={(e) => setCollabGoal(e.target.value)}
                disabled={isExecuting}
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  background: "#0F172A",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#F8FAFC",
                  fontSize: "0.78rem",
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                Coordinator: <span style={{ color: "#38BDF8" }}>{collabPlan?.coordinatorAgentId}</span>
              </span>
              <button
                type="button"
                onClick={handleRunCollaboration}
                disabled={isExecuting}
                style={{
                  padding: "6px 18px",
                  borderRadius: "6px",
                  border: "none",
                  background: isExecuting ? "rgba(56, 189, 248, 0.4)" : "#38BDF8",
                  color: "#0F172A",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: isExecuting ? "not-allowed" : "pointer",
                  boxShadow: "0 0 12px rgba(56, 189, 248, 0.3)",
                }}
              >
                {isExecuting ? `Orchestrating (${collabProgress}%)...` : "🚀 Launch Multi-Agent Team"}
              </button>
            </div>
          </div>

          {/* Sub-tabs: Parallel Waves, Messages, Conflicts, Quality Gates, Deliverable */}
          <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "4px" }}>
            <button
              type="button"
              onClick={() => setCollabActiveTab("waves")}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: collabActiveTab === "waves" ? "1px solid #38BDF8" : "none",
                background: collabActiveTab === "waves" ? "rgba(56, 189, 248, 0.15)" : "transparent",
                color: collabActiveTab === "waves" ? "#38BDF8" : "#94A3B8",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              🌊 Waves ({collabPlan?.parallelWaves.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setCollabActiveTab("messages")}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: collabActiveTab === "messages" ? "1px solid #38BDF8" : "none",
                background: collabActiveTab === "messages" ? "rgba(56, 189, 248, 0.15)" : "transparent",
                color: collabActiveTab === "messages" ? "#38BDF8" : "#94A3B8",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              💬 Messages ({collabMessages.length})
            </button>
            <button
              type="button"
              onClick={() => setCollabActiveTab("conflicts")}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: collabActiveTab === "conflicts" ? "1px solid #F59E0B" : "none",
                background: collabActiveTab === "conflicts" ? "rgba(245, 158, 11, 0.15)" : "transparent",
                color: collabActiveTab === "conflicts" ? "#FBBF24" : "#94A3B8",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              ⚖️ Conflicts ({collabConflicts.length})
            </button>
            <button
              type="button"
              onClick={() => setCollabActiveTab("quality")}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: collabActiveTab === "quality" ? "1px solid #10B981" : "none",
                background: collabActiveTab === "quality" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                color: collabActiveTab === "quality" ? "#34D399" : "#94A3B8",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              🛡️ Quality Gates
            </button>
            <button
              type="button"
              onClick={() => setCollabActiveTab("deliverable")}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: collabActiveTab === "deliverable" ? "1px solid #A855F7" : "none",
                background: collabActiveTab === "deliverable" ? "rgba(168, 85, 247, 0.15)" : "transparent",
                color: collabActiveTab === "deliverable" ? "#C084FC" : "#94A3B8",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              📦 Deliverable
            </button>
          </div>

          {/* Tab 1: Execution Waves */}
          {collabActiveTab === "waves" && collabPlan && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {collabPlan.parallelWaves.map((waveTaskIds, wIdx) => (
                <div
                  key={wIdx}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    background: "rgba(15, 23, 42, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#38BDF8", marginBottom: "4px" }}>
                    WAVE {wIdx + 1} (Concurrent: {waveTaskIds.length} tasks)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {waveTaskIds.map((taskId) => {
                      const t = collabPlan.tasks.find((task) => task.id === taskId);
                      const assigned = agents.find((a) => a.id === t?.assignedAgentId);
                      return (
                        <div
                          key={taskId}
                          style={{
                            padding: "6px 8px",
                            borderRadius: "4px",
                            background: "rgba(10, 14, 23, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>{assigned?.icon || "⚙️"}</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{t?.description}</span>
                          </div>
                          <span style={{ fontSize: "0.68rem", color: "#64748B" }}>
                            {assigned?.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Messages */}
          {collabActiveTab === "messages" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "200px", overflowY: "auto" }}>
              {collabMessages.length === 0 ? (
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>No communication messages yet. Launch orchestration to monitor bus.</span>
              ) : (
                collabMessages.map((m) => (
                  <div key={m.id} style={{ fontSize: "0.7rem", padding: "4px 8px", background: "rgba(15, 23, 42, 0.4)", borderRadius: "4px", display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ color: "#38BDF8", fontWeight: 600 }}>[{m.senderAgentId}]</span>
                      <span style={{ color: "#64748B" }}> ➔ </span>
                      <span style={{ color: "#A855F7", fontWeight: 600 }}>[{m.recipientAgentId}]</span>
                      <span style={{ color: "#F8FAFC", marginLeft: "6px" }}>{m.type}</span>
                    </div>
                    <span style={{ color: "#64748B", fontFamily: "monospace" }}>#{m.sequenceNumber}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Conflicts */}
          {collabActiveTab === "conflicts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {collabConflicts.length === 0 ? (
                <span style={{ fontSize: "0.75rem", color: "#4ADE80" }}>Zero unresolved conflicts detected. All agent proposals aligned.</span>
              ) : (
                collabConflicts.map((c) => (
                  <div key={c.id} style={{ padding: "8px", borderRadius: "6px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.75rem", color: "#FBBF24" }}>{c.conflictType}</span>
                      <span style={{ fontSize: "0.68rem", color: "#64748B" }}>{c.approvalStatus}</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#CBD5E1", marginBottom: "6px" }}>{c.details}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.68rem", color: "#94A3B8" }}>{c.reason}</span>
                      {c.approvalStatus === "pending" && (
                        <button
                          type="button"
                          onClick={() => handleResolveConflictManually(c.id)}
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            border: "none",
                            background: "#F59E0B",
                            color: "#0F172A",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            cursor: "pointer",
                          }}
                        >
                          Resolve (Rule-based)
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 4: Quality Gates */}
          {collabActiveTab === "quality" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {collabDeliverable?.qualityValidation ? (
                collabDeliverable.qualityValidation.gates.map((g) => (
                  <div key={g.id} style={{ padding: "6px 8px", borderRadius: "4px", background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.74rem", color: "#F1F5F9" }}>{g.name}</div>
                      <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>{g.summary}</div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: "0.7rem", color: g.status === "passed" ? "#4ADE80" : g.status === "warning" ? "#FBBF24" : "#F87171" }}>
                      {g.status.toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Launch orchestration to evaluate collective quality gates.</span>
              )}
            </div>
          )}

          {/* Tab 5: Deliverable */}
          {collabActiveTab === "deliverable" && (
            <div>
              {collabDeliverable ? (
                <pre style={{ margin: 0, padding: "8px", borderRadius: "4px", background: "#0A0E17", color: "#CBD5E1", fontSize: "0.7rem", maxHeight: "180px", overflowY: "auto", fontFamily: "monospace" }}>
                  {JSON.stringify(collabDeliverable.consolidatedDeliverable || collabDeliverable, null, 2)}
                </pre>
              ) : (
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>No deliverable generated yet.</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. SINGLE-AGENT WORKFLOW MODE (PROMPT 144) */}
      {panelMode === "workflows" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "#94A3B8", marginBottom: "4px", fontWeight: 600 }}>
              WORKFLOW TEMPLATE
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              disabled={isExecuting}
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: "6px",
                background: "#0F172A",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#F8FAFC",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} (~{(tmpl.estimatedDurationMs / 1000).toFixed(1)}s)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "#94A3B8", marginBottom: "4px", fontWeight: 600 }}>
              CREATIVE GOAL
            </label>
            <textarea
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              disabled={isExecuting}
              rows={2}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                background: "#0F172A",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#F8FAFC",
                fontSize: "0.8rem",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
