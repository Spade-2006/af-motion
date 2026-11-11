import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useCopyCode } from "@/playground/hooks/useCopyCode";
import { PACKAGE_MANAGERS, type PackageManager } from "../data/onboardingData";
import { Check, Copy, Terminal, Info } from "lucide-react";

export interface InstallSelectorProps {
  readonly onInstallCopy?: () => void;
}

export const InstallSelector: React.FC<InstallSelectorProps> = ({
  onInstallCopy,
}) => {
  const [activePm, setActivePm] = useState<PackageManager>("npm");
  const { copied, copy } = useCopyCode();
  const { copied: cliCopied, copy: copyCli } = useCopyCode();

  const current =
    PACKAGE_MANAGERS.find((pm) => pm.id === activePm) ?? PACKAGE_MANAGERS[0];

  const handleCopyInstall = async () => {
    await copy(current.command);
    onInstallCopy?.();
  };

  return (
    <Card variant="elevated" className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="cyan" size="sm" className="mb-2">
            Step 1 · Installation
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Install the af-motion Package
          </h2>
        </div>

        {/* Package Manager Tabs */}
        <div
          role="tablist"
          aria-label="Package manager selector"
          className="inline-flex p-1 rounded-xl bg-[#07090f] border border-white/[0.08]"
        >
          {PACKAGE_MANAGERS.map((pm) => {
            const selected = pm.id === activePm;
            return (
              <button
                key={pm.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActivePm(pm.id)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-medium transition-colors cursor-pointer ${
                  selected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {pm.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Install Command */}
      <div className="rounded-xl bg-[#07090f] border border-white/[0.1] p-3 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto font-mono text-xs sm:text-sm min-w-0">
          <Terminal className="w-4 h-4 text-cyan-400 shrink-0 hidden sm:inline" />
          <span className="text-indigo-400 select-none">$</span>
          <code data-testid="install-command" className="text-slate-100 whitespace-nowrap">
            {current.command}
          </code>
        </div>

        <button
          type="button"
          onClick={handleCopyInstall}
          aria-label={`Copy ${current.label} install command`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-mono text-slate-200 transition-colors cursor-pointer shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Optional CLI Scaffolding Command + Peer Dependency Note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.07] space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
            Optional Project CLI Setup
          </div>
          <div className="flex items-center justify-between gap-2 font-mono text-xs bg-[#07090f] px-3 py-2 rounded-lg border border-white/[0.06]">
            <code className="text-cyan-300 truncate">{current.cliNote}</code>
            <button
              type="button"
              onClick={() => copyCli(current.cliNote)}
              aria-label="Copy CLI init command"
              className="text-slate-400 hover:text-white cursor-pointer shrink-0"
            >
              {cliCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Run <code className="text-slate-300">npx af-motion doctor</code> anytime to verify
            TypeScript definitions and subpath imports.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.07] space-y-2">
          <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-indigo-300">
            <Info className="w-3.5 h-3.5" />
            <span>Peer Dependencies &amp; ESM Notes</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Core <code className="text-cyan-300">af-motion</code> has{" "}
            <strong className="text-white">zero required runtime dependencies</strong>.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            <code className="text-slate-300">react</code> (<code className="text-slate-300">^18.0.0 || ^19.0.0</code>) is declared as an
            optional peer dependency for <code className="text-cyan-300">af-motion/react</code> bindings.
          </p>
        </div>
      </div>
    </Card>
  );
};
