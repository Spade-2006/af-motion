import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CodeInspector } from "@/playground/components/CodeInspector";
import { ExampleLivePreview } from "./ExampleLivePreview";
import { getDocArticleForExample } from "@/docs/data/docsBridge";
import type { CuratedExampleSpec } from "../data/examplesCatalog";
import { BookOpen, Code2, ChevronDown, ChevronUp, Play } from "lucide-react";

export interface ExampleCardProps {
  readonly example: CuratedExampleSpec;
}

export const ExampleCard: React.FC<ExampleCardProps> = ({ example }) => {
  const [showCode, setShowCode] = useState(false);
  const relatedDoc = getDocArticleForExample(example.id);

  const difficultyVariant =
    example.difficulty === "Beginner"
      ? "emerald"
      : example.difficulty === "Intermediate"
      ? "cyan"
      : "glow";

  return (
    <Card
      variant="elevated"
      className="p-5 sm:p-6 flex flex-col justify-between gap-4"
    >
      <div className="space-y-4">
        {/* Top Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="default" size="sm">
            {example.category}
          </Badge>
          <Badge variant={difficultyVariant} size="sm">
            {example.difficulty}
          </Badge>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-1.5">{example.name}</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {example.description}
          </p>
        </div>

        {/* Working Interactive Preview */}
        <ExampleLivePreview exampleId={example.id} />

        {/* Relevant APIs */}
        <div className="flex flex-wrap gap-1.5">
          {example.apis.map((api) => (
            <code
              key={api}
              className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] font-mono text-[10px] text-cyan-300"
            >
              {api}
            </code>
          ))}
        </div>
      </div>

      {/* Expandable Copyable Code */}
      {showCode && (
        <div className="pt-2">
          <CodeInspector tsCode={example.code} subpath={example.subpath} />
        </div>
      )}

      {/* Actions & Cross-Links */}
      <div className="pt-3 border-t border-white/[0.06] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowCode((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-xs font-mono text-slate-200 transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showCode ? "Hide Code" : "View Code"}</span>
            {showCode ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {example.playgroundDemoId && (
            <Button
              variant="secondary"
              size="sm"
              iconLeading={<Play className="w-3 h-3 text-cyan-400" />}
              onClick={() => {
                window.location.hash = `#playground/${example.playgroundDemoId}`;
              }}
            >
              Open in Playground
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
          {relatedDoc ? (
            <a
              href={`#docs/${relatedDoc.slug}`}
              className="inline-flex items-center gap-1 text-cyan-400 hover:underline truncate"
            >
              <BookOpen className="w-3 h-3 shrink-0" />
              <span>Docs: {relatedDoc.title}</span>
            </a>
          ) : (
            <span />
          )}

          {example.difficulty === "Beginner" && (
            <a href="#onboarding" className="text-emerald-400 hover:underline shrink-0">
              Onboarding →
            </a>
          )}
        </div>
      </div>
    </Card>
  );
};
