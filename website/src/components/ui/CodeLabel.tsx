import React, { useState } from "react";
import { cn } from "@/utils/cn";
import { Check, Copy } from "lucide-react";

export interface CodeLabelProps {
  readonly code: string;
  readonly prefix?: string;
  readonly className?: string;
}

export const CodeLabel: React.FC<CodeLabelProps> = ({
  code,
  prefix = "$",
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed
    }
  };

  return (
    <div
      onClick={handleCopy}
      title="Click to copy command"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCopy();
        }
      }}
      className={cn(
        "inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#0e111a] border border-white/[0.1] hover:border-indigo-500/40 font-mono text-xs text-slate-300 transition-all duration-200 cursor-pointer group shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500/50",
        className
      )}
    >
      {prefix && <span className="text-indigo-400 font-semibold select-none">{prefix}</span>}
      <span className="font-mono text-slate-200 select-all">{code}</span>
      <span className="text-slate-500 group-hover:text-slate-300 transition-colors ml-1">
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </span>
    </div>
  );
};
