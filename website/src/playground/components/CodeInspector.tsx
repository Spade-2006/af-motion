import React, { useMemo, useState } from "react";
import { Check, Copy, RotateCcw, Code2 } from "lucide-react";
import { useCopyCode } from "../hooks/useCopyCode";
import type { CodeLanguage } from "../types";
import { cn } from "@/utils/cn";

export interface CodeInspectorProps {
  readonly tsCode: string;
  readonly jsCode?: string;
  readonly subpath: string;
  readonly onReset?: () => void;
  readonly className?: string;
}

function stripTypeAnnotationsForJS(tsCode: string): string {
  return tsCode
    .replace(/import type \{[^}]+\} from [^;]+;\r?\n?/g, "")
    .replace(/:\s*(?:number|string|boolean|HTMLElement|HTMLCanvasElement|SVGElement)\b/g, "");
}

function highlightLineTokens(line: string): React.ReactNode[] {
  const tokenPattern =
    /(\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:import|from|export|const|let|function|return|true|false|null|undefined|type|interface)\b|\b\d+(?:\.\d+)?\b)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = tokenPattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={`p-${keyCounter++}`} className="text-slate-200">
          {line.slice(lastIndex, match.index)}
        </span>
      );
    }

    const token = match[0];
    let cls = "text-slate-200";
    if (token.startsWith("//")) {
      cls = "text-slate-500 italic";
    } else if (token.startsWith('"') || token.startsWith("'")) {
      cls = "text-emerald-400";
    } else if (/^\d/.test(token)) {
      cls = "text-amber-300";
    } else {
      cls = "text-purple-400";
    }

    nodes.push(
      <span key={`t-${keyCounter++}`} className={cls}>
        {token}
      </span>
    );
    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    nodes.push(
      <span key={`e-${keyCounter++}`} className="text-slate-200">
        {line.slice(lastIndex)}
      </span>
    );
  }

  return nodes.length > 0 ? nodes : [<span key="empty">{" "}</span>];
}

export const CodeInspector: React.FC<CodeInspectorProps> = ({
  tsCode,
  jsCode,
  subpath,
  onReset,
  className,
}) => {
  const [lang, setLang] = useState<CodeLanguage>("ts");
  const { copied, copy } = useCopyCode();

  const activeCode = useMemo(() => {
    if (lang === "ts") return tsCode;
    return jsCode ?? stripTypeAnnotationsForJS(tsCode);
  }, [lang, tsCode, jsCode]);

  const lines = useMemo(() => activeCode.split(/\r?\n/), [activeCode]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#0a0c12] overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Inspector Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0e111a] border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Generated Example</span>
          </div>
          <span className="hidden sm:inline font-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.05] text-indigo-300 border border-white/[0.06]">
            {subpath}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* TS / JS Language Toggle */}
          <div
            role="group"
            aria-label="Code language selector"
            className="inline-flex rounded-lg bg-[#090b10] p-0.5 border border-white/[0.08]"
          >
            {(["ts", "js"] as const).map((targetLang) => (
              <button
                key={targetLang}
                type="button"
                onClick={() => setLang(targetLang)}
                className={cn(
                  "px-2.5 py-1 rounded-md font-mono text-[11px] uppercase transition-colors cursor-pointer",
                  lang === targetLang
                    ? "bg-indigo-600/25 text-cyan-300 border border-indigo-500/40"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {targetLang}
              </button>
            ))}
          </div>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              title="Reset configuration"
              aria-label="Reset configuration"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] font-mono text-[11px] text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => copy(activeCode)}
            aria-label="Copy generated code"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 font-mono text-[11px] text-indigo-200 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Line-numbered Code View */}
      <div className="p-4 sm:p-5 overflow-x-auto max-h-[340px] font-mono text-xs leading-6">
        <pre className="m-0">
          <code>
            {lines.map((line, i) => (
              <div key={i} className="flex min-h-[1.5rem]">
                <span className="w-8 shrink-0 select-none text-slate-600 text-right pr-3">
                  {i + 1}
                </span>
                <span className="whitespace-pre">{highlightLineTokens(line)}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};
