// @vitest-environment node

import { createElement, useRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AnimatedText,
  Reveal,
  useAnimate,
  useInView,
  useParallel,
  useScrollProgress,
  useScrollVelocity,
  useSequence,
  useTimeline,
} from "../src/react";

describe("React SSR and Node.js environment safety", () => {
  it("imports the React entry point in pure Node.js without accessing browser globals", () => {
    // In @vitest-environment node, window, document, and navigator are undefined
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
    expect(typeof IntersectionObserver).toBe("undefined");
    expect(typeof matchMedia).toBe("undefined");
  });

  it("renders AnimatedText with renderToString in pure Node.js", () => {
    const htmlTypewriter = renderToString(
      createElement(AnimatedText, { text: "Typewriter SSR", effect: "typewriter" }),
    );
    expect(htmlTypewriter).toContain('aria-label="Typewriter SSR"');
    expect(htmlTypewriter).toContain('aria-hidden="true">Typewriter SSR</span>');

    const htmlScramble = renderToString(
      createElement(AnimatedText, { text: "Scramble SSR", effect: "scramble" }),
    );
    expect(htmlScramble).toContain('aria-label="Scramble SSR"');

    const htmlGradient = renderToString(
      createElement(AnimatedText, { text: "Gradient SSR", effect: "gradient" }),
    );
    expect(htmlGradient).toContain('aria-label="Gradient SSR"');
  });

  it("renders Reveal with renderToString in pure Node.js", () => {
    const html = renderToString(
      createElement(
        Reveal,
        { direction: "up", duration: 500, className: "reveal-wrapper" },
        createElement("p", null, "Reveal Child Content"),
      ),
    );
    expect(html).toContain('class="reveal-wrapper"');
    expect(html).toContain("<p>Reveal Child Content</p>");
  });

  it("renders components using useInView with renderToString in pure Node.js", () => {
    function InViewComp() {
      const { ref, isInView } = useInView<HTMLDivElement>({ once: false });
      return createElement("div", { ref, "data-in-view": String(isInView) }, "InView Content");
    }

    const html = renderToString(createElement(InViewComp));
    expect(html).toContain('data-in-view="false"');
    expect(html).toContain("InView Content");
  });

  it("renders components using useScrollProgress with renderToString in pure Node.js", () => {
    function ScrollComp() {
      const { ref, progress } = useScrollProgress<HTMLDivElement>();
      return createElement("div", { ref, "data-progress": String(progress) }, "Scroll Content");
    }

    const html = renderToString(createElement(ScrollComp));
    expect(html).toContain('data-progress="0"');
    expect(html).toContain("Scroll Content");
  });

  it("renders components using useScrollVelocity with renderToString in pure Node.js", () => {
    function VelocityComp() {
      const { ref, data } = useScrollVelocity<HTMLDivElement>();
      return createElement("div", { ref, "data-velocity": String(data.velocity), "data-direction": data.direction }, "Velocity Content");
    }

    const html = renderToString(createElement(VelocityComp));
    expect(html).toContain('data-velocity="0"');
    expect(html).toContain('data-direction="idle"');
  });

  it("renders components using useAnimate with renderToString in pure Node.js", () => {
    function AnimateComp() {
      const { ref, animate } = useAnimate<HTMLDivElement>();
      // animate is callable or inert during render
      return createElement("div", { ref, "data-has-animate": String(typeof animate === "function") }, "Animate Content");
    }

    const html = renderToString(createElement(AnimateComp));
    expect(html).toContain('data-has-animate="true"');
    expect(html).toContain("Animate Content");
  });

  it("renders components using useSequence with renderToString in pure Node.js", () => {
    function SequenceComp() {
      const ref = useRef<HTMLDivElement>(null);
      const { play, finished } = useSequence([
        { target: ref, properties: { opacity: [0, 1] } },
      ]);
      return createElement(
        "div",
        { ref, "data-finished": String(finished === null), "data-has-play": String(typeof play === "function") },
        "Sequence Content",
      );
    }

    const html = renderToString(createElement(SequenceComp));
    expect(html).toContain('data-finished="true"');
    expect(html).toContain('data-has-play="true"');
  });

  it("renders components using useParallel with renderToString in pure Node.js", () => {
    function ParallelComp() {
      const ref = useRef<HTMLDivElement>(null);
      const { play, finished } = useParallel([
        { target: ref, properties: { opacity: [0, 1] } },
      ]);
      return createElement(
        "div",
        { ref, "data-finished": String(finished === null), "data-has-play": String(typeof play === "function") },
        "Parallel Content",
      );
    }

    const html = renderToString(createElement(ParallelComp));
    expect(html).toContain('data-finished="true"');
    expect(html).toContain('data-has-play="true"');
  });

  it("renders components using useTimeline with renderToString in pure Node.js", () => {
    function TimelineComp() {
      const { play, timeline, finished } = useTimeline((tl) => {
        tl.add({ at: 0, target: "div", properties: { opacity: [0, 1] } });
      });
      return createElement(
        "div",
        { "data-timeline-null": String(timeline === null), "data-finished-null": String(finished === null), "data-has-play": String(typeof play === "function") },
        "Timeline Content",
      );
    }

    const html = renderToString(createElement(TimelineComp));
    expect(html).toContain('data-timeline-null="true"');
    expect(html).toContain('data-finished-null="true"');
    expect(html).toContain('data-has-play="true"');
  });
});
