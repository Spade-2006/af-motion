import { useState, useCallback } from "react";

export function useCopyCode(timeoutMs = 1800) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), timeoutMs);
        return true;
      } catch {
        setCopied(false);
        return false;
      }
    },
    [timeoutMs]
  );

  return { copied, copy };
}
