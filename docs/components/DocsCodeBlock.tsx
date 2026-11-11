import React, { useState } from "react";

interface DocsCodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export const DocsCodeBlock: React.FC<DocsCodeBlockProps> = ({
  code,
  language = "typescript",
  filename,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="docs-code-container">
      <div className="docs-code-header">
        <div className="docs-code-left">
          {filename && <span className="docs-code-filename">{filename}</span>}
          <span className="docs-code-lang">{language}</span>
        </div>
        <button
          type="button"
          className="docs-code-copy-btn"
          onClick={handleCopy}
          title="Copy code snippet to clipboard"
        >
          {copied ? "✓ Copied!" : "📋 Copy"}
        </button>
      </div>
      <pre className="docs-code-pre">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
};
