/**
 * AF Motion CLI — Terminal & Formatting Utilities
 *
 * Lightweight, dependency-free ANSI formatting with automatic color suppression
 * for non-TTY, CI, and NO_COLOR environments.
 */

export class Terminal {
  private enabled: boolean;

  constructor(forceColor?: boolean) {
    if (forceColor !== undefined) {
      this.enabled = forceColor;
    } else {
      const isNoColor = typeof process !== "undefined" && Boolean(process.env.NO_COLOR);
      const isDumb = typeof process !== "undefined" && process.env.TERM === "dumb";
      const isTTY = typeof process !== "undefined" && Boolean(process.stdout?.isTTY);
      const isCI = typeof process !== "undefined" && Boolean(process.env.CI);
      // Enable color if TTY or CI, unless explicitly disabled by NO_COLOR or dumb terminal
      this.enabled = !isNoColor && !isDumb && (isTTY || isCI);
    }
  }

  public setColorEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isColorEnabled(): boolean {
    return this.enabled;
  }

  private wrap(open: number, close: number, text: string): string {
    if (!this.enabled) return text;
    return `\x1b[${open}m${text}\x1b[${close}m`;
  }

  public bold(text: string): string {
    return this.wrap(1, 22, text);
  }

  public dim(text: string): string {
    return this.wrap(2, 22, text);
  }

  public red(text: string): string {
    return this.wrap(31, 39, text);
  }

  public green(text: string): string {
    return this.wrap(32, 39, text);
  }

  public yellow(text: string): string {
    return this.wrap(33, 39, text);
  }

  public blue(text: string): string {
    return this.wrap(34, 39, text);
  }

  public magenta(text: string): string {
    return this.wrap(35, 39, text);
  }

  public cyan(text: string): string {
    return this.wrap(36, 39, text);
  }

  public gray(text: string): string {
    return this.wrap(90, 39, text);
  }

  public pass(text = "PASS"): string {
    return this.green(`✓ ${text}`);
  }

  public warn(text = "WARN"): string {
    return this.yellow(`⚠ ${text}`);
  }

  public fail(text = "FAIL"): string {
    return this.red(`✗ ${text}`);
  }

  public info(text = "INFO"): string {
    return this.cyan(`ℹ ${text}`);
  }

  public banner(title: string, subtitle?: string): string {
    const lines = [
      this.bold(this.cyan(`=== ${title} ===`)),
    ];
    if (subtitle) {
      lines.push(this.dim(subtitle));
    }
    return lines.join("\n");
  }

  public table(headers: string[], rows: string[][]): string {
    if (rows.length === 0) return "";
    const colWidths = headers.map((h, i) => {
      let max = h.length;
      for (const row of rows) {
        const cell = row[i] ?? "";
        // Strip ANSI escapes when calculating length
        const plain = cell.replace(/\x1b\[[0-9;]*m/g, "");
        if (plain.length > max) max = plain.length;
      }
      return max + 2;
    });

    const formatRow = (cells: string[]) =>
      cells.map((c, i) => {
        const plain = c.replace(/\x1b\[[0-9;]*m/g, "");
        const pad = " ".repeat(Math.max(0, colWidths[i] - plain.length));
        return `${c}${pad}`;
      }).join("");

    const headerLine = this.bold(formatRow(headers));
    const separator = this.dim("-".repeat(colWidths.reduce((a, b) => a + b, 0)));
    const rowLines = rows.map((r) => formatRow(r));

    return [headerLine, separator, ...rowLines].join("\n");
  }
}

export const term = new Terminal();
