import React, { Suspense, useCallback, useMemo, useState } from "react";
import { DEMO_REGISTRY, getDemoById } from "../registry/demoRegistry";
import { PlaygroundSidebar } from "./PlaygroundSidebar";
import { PlaygroundToolbar, type PlaygroundViewMode } from "./PlaygroundToolbar";
import { CodeInspector } from "./CodeInspector";
import { DemoErrorBoundary } from "./DemoErrorBoundary";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { Sparkles } from "lucide-react";

export interface PlaygroundLayoutProps {
  readonly initialDemoId?: string;
}

export const PlaygroundLayout: React.FC<PlaygroundLayoutProps> = ({
  initialDemoId = "basic-animate",
}) => {
  const [activeDemoId, setActiveDemoId] = useState(initialDemoId);
  const [playNonce, setPlayNonce] = useState(0);
  const [resetNonce, setResetNonce] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<PlaygroundViewMode>("split");
  const [tsCode, setTsCode] = useState("");
  const [jsCode, setJsCode] = useState<string | undefined>(undefined);
  const [statusText, setStatusText] = useState<string>("Ready");

  const activeDemo = useMemo(() => getDemoById(activeDemoId), [activeDemoId]);

  // Cache React.lazy wrapper per selected demo ID so parameter changes never re-suspend
  const ActiveDemoComponent = useMemo(
    () => React.lazy(activeDemo.load),
    [activeDemo]
  );

  const handleSelectDemo = useCallback((id: string) => {
    setActiveDemoId(id);
    setIsPaused(false);
    setPlayNonce(0);
    setResetNonce(0);
    setJsCode(undefined);
  }, []);

  const handleCodeChange = useCallback((nextTs: string, nextJs?: string) => {
    setTsCode(nextTs);
    setJsCode(nextJs);
  }, []);

  const handleRun = useCallback(() => {
    setIsPaused(false);
    setPlayNonce((n) => n + 1);
  }, []);

  const handleReset = useCallback(() => {
    setIsPaused(false);
    setResetNonce((n) => n + 1);
  }, []);

  return (
    <PageContainer maxWidth="2xl" className="pt-24 sm:pt-28 pb-20">
      {/* Laboratory Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <Badge variant="glow" size="sm" className="mb-3">
            <Sparkles className="w-3 h-3 mr-1.5 inline" />
            Interactive Motion Playground
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            AF Motion Playground
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
            {activeDemo.description}
          </p>
        </div>

        <div className="font-mono text-xs text-slate-400 shrink-0">
          {DEMO_REGISTRY.length} Interactive Labs · Live SDK Bindings
        </div>
      </div>

      {/* Main Responsive Workspace: Left Sidebar + Right Lab Column */}
      <div className="flex flex-col lg:flex-row gap-6 items-start [&>*]:min-w-0">
        <PlaygroundSidebar
          demos={DEMO_REGISTRY}
          activeDemoId={activeDemo.id}
          onSelectDemo={handleSelectDemo}
        />

        {/* Workspace Column */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-4">
          <PlaygroundToolbar
            demo={activeDemo}
            statusText={statusText}
            isPaused={isPaused}
            viewMode={viewMode}
            currentCode={tsCode}
            onRun={handleRun}
            onTogglePause={() => setIsPaused((p) => !p)}
            onReset={handleReset}
            onViewModeChange={setViewMode}
          />

          {/* Interactive Stage + Controls (Visible in 'split' or 'preview' modes) */}
          {viewMode !== "code" && (
            <DemoErrorBoundary demoId={activeDemo.id} onReset={handleReset}>
              <Suspense
                fallback={
                  <div
                    role="status"
                    aria-label="Loading demonstration module"
                    className="w-full min-h-[360px] rounded-2xl bg-[#090b12] border border-white/[0.08] flex flex-col items-center justify-center gap-3 p-8"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-cyan-400 animate-spin" />
                    <span className="font-mono text-xs text-slate-400">
                      Loading {activeDemo.shortLabel}...
                    </span>
                  </div>
                }
              >
                <ActiveDemoComponent
                  playNonce={playNonce}
                  resetNonce={resetNonce}
                  isPaused={isPaused}
                  onCodeChange={handleCodeChange}
                  onStatusChange={setStatusText}
                />
              </Suspense>
            </DemoErrorBoundary>
          )}

          {/* Code Inspector Panel (Visible in 'split' or 'code' modes) */}
          {viewMode !== "preview" && (
            <CodeInspector
              tsCode={tsCode}
              jsCode={jsCode}
              subpath={activeDemo.subpath}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
};
