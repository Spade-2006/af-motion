// @vitest-environment jsdom

import { act, createElement, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

let host: HTMLDivElement;
let root: Root;
let mounted: boolean;

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  mounted = false;
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  if (mounted) act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderComponent(component: () => JSX.Element | null): void {
  act(() => {
    mounted = true;
    root.render(createElement(component));
  });
}

describe("useInView validation", () => {
  it("rejects non-object options", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid options
      useInView("not an object");
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("options must be an object");
  });

  it("rejects non-function callbacks", () => {
    function CompEnter(): JSX.Element {
      // @ts-expect-error invalid callback
      useInView({ onEnter: 123 });
      return createElement("div");
    }
    expect(() => renderComponent(CompEnter)).toThrow(TypeError);
    expect(() => renderComponent(CompEnter)).toThrow("onEnter must be a function");

    function CompLeave(): JSX.Element {
      // @ts-expect-error invalid callback
      useInView({ onLeave: "fn" });
      return createElement("div");
    }
    expect(() => renderComponent(CompLeave)).toThrow(TypeError);
    expect(() => renderComponent(CompLeave)).toThrow("onLeave must be a function");

    function CompChange(): JSX.Element {
      // @ts-expect-error invalid callback
      useInView({ onChange: true });
      return createElement("div");
    }
    expect(() => renderComponent(CompChange)).toThrow(TypeError);
    expect(() => renderComponent(CompChange)).toThrow("onChange must be a function");
  });
});

describe("useScrollProgress validation", () => {
  it("rejects non-object options", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid options
      useScrollProgress(null);
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("options must be an object");
  });

  it("rejects non-function onUpdate", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid callback
      useScrollProgress({ onUpdate: "bad" });
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("onUpdate must be a function");
  });

  it("rejects invalid height", () => {
    function CompZero(): JSX.Element {
      useScrollProgress({ height: 0 });
      return createElement("div");
    }
    expect(() => renderComponent(CompZero)).toThrow(RangeError);
    expect(() => renderComponent(CompZero)).toThrow("height must be a finite number > 0");

    function CompNeg(): JSX.Element {
      useScrollProgress({ height: -5 });
      return createElement("div");
    }
    expect(() => renderComponent(CompNeg)).toThrow(RangeError);

    function CompNaN(): JSX.Element {
      useScrollProgress({ height: Number.NaN });
      return createElement("div");
    }
    expect(() => renderComponent(CompNaN)).toThrow(RangeError);
  });

  it("rejects invalid smoothing", () => {
    function CompNegative(): JSX.Element {
      useScrollProgress({ smoothing: -0.1 });
      return createElement("div");
    }
    expect(() => renderComponent(CompNegative)).toThrow(RangeError);
    expect(() => renderComponent(CompNegative)).toThrow("smoothing must be a finite number between 0 and 1");

    function CompTooLarge(): JSX.Element {
      useScrollProgress({ smoothing: 1.5 });
      return createElement("div");
    }
    expect(() => renderComponent(CompTooLarge)).toThrow(RangeError);
  });
});

describe("useScrollVelocity validation", () => {
  it("rejects non-object options", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid options
      useScrollVelocity(123);
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("options must be an object");
  });

  it("rejects non-function onUpdate", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid callback
      useScrollVelocity({ onUpdate: {} });
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("onUpdate must be a function");
  });

  it("rejects invalid smoothing", () => {
    function Comp(): JSX.Element {
      useScrollVelocity({ smoothing: 2 });
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(RangeError);
    expect(() => renderComponent(Comp)).toThrow("smoothing must be a finite number between 0 and 1");
  });
});

describe("useAnimate validation", () => {
  it("rejects non-object options in animate()", () => {
    let capturedAnimate: ReturnType<typeof useAnimate>["animate"];
    function Comp(): JSX.Element {
      const { ref, animate } = useAnimate();
      capturedAnimate = animate;
      return createElement("div", { ref });
    }
    renderComponent(Comp);

    // @ts-expect-error invalid options
    expect(() => capturedAnimate({ opacity: 1 }, "bad")).toThrow(TypeError);
    // @ts-expect-error invalid options
    expect(() => capturedAnimate({ opacity: 1 }, "bad")).toThrow("options must be an object");
  });

  it("rejects non-function callbacks in animate()", () => {
    let capturedAnimate: ReturnType<typeof useAnimate>["animate"];
    function Comp(): JSX.Element {
      const { ref, animate } = useAnimate();
      capturedAnimate = animate;
      return createElement("div", { ref });
    }
    renderComponent(Comp);

    // @ts-expect-error invalid callback
    expect(() => capturedAnimate({ opacity: 1 }, { onComplete: "bad" })).toThrow(TypeError);
    // @ts-expect-error invalid callback
    expect(() => capturedAnimate({ opacity: 1 }, { onCancel: 42 })).toThrow(TypeError);
  });
});

describe("useSequence validation", () => {
  it("rejects non-array steps", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid steps
      useSequence("not-an-array");
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("steps must be an array");
  });

  it("rejects non-object options", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid options
      useSequence([], "invalid");
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("options must be an object");
  });

  it("rejects non-function lifecycle callbacks", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid callback
      useSequence([], { onStart: "bad" });
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("onStart must be a function");
  });

  it("rejects invalid arguments in play() and setPlaybackRate()", () => {
    let captured: ReturnType<typeof useSequence>;
    function Comp(): JSX.Element {
      captured = useSequence([], { autoplay: false });
      return createElement("div");
    }
    renderComponent(Comp);

    // @ts-expect-error invalid overrideSteps
    expect(() => captured.play("invalid")).toThrow(TypeError);
    // @ts-expect-error invalid overrideOptions
    expect(() => captured.play([], "invalid")).toThrow(TypeError);
    // @ts-expect-error invalid override callback
    expect(() => captured.play([], { onComplete: "bad" })).toThrow(TypeError);

    expect(() => captured.setPlaybackRate(0)).toThrow(RangeError);
    expect(() => captured.setPlaybackRate(-1)).toThrow(RangeError);
    expect(() => captured.setPlaybackRate(Number.NaN)).toThrow(RangeError);
  });
});

describe("useParallel validation", () => {
  it("rejects non-array steps", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid steps
      useParallel("not-an-array");
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("steps must be an array");
  });

  it("rejects non-object options", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid options
      useParallel([], 123);
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("options must be an object");
  });

  it("rejects non-function lifecycle callbacks", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid callback
      useParallel([], { onComplete: 42 });
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("onComplete must be a function");
  });

  it("rejects invalid arguments in play() and setPlaybackRate()", () => {
    let captured: ReturnType<typeof useParallel>;
    function Comp(): JSX.Element {
      captured = useParallel([], { autoplay: false });
      return createElement("div");
    }
    renderComponent(Comp);

    // @ts-expect-error invalid overrideSteps
    expect(() => captured.play("invalid")).toThrow(TypeError);
    // @ts-expect-error invalid overrideOptions
    expect(() => captured.play([], "invalid")).toThrow(TypeError);

    expect(() => captured.setPlaybackRate(-0.5)).toThrow(RangeError);
    expect(() => captured.setPlaybackRate(Infinity)).toThrow(RangeError);
  });
});

describe("useTimeline validation", () => {
  it("rejects non-function builder", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid builder
      useTimeline("not-a-fn");
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("builder must be a function");
  });

  it("rejects non-object options", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid options
      useTimeline(() => {}, "invalid");
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("options must be an object");
  });

  it("rejects non-function lifecycle callbacks", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid callback
      useTimeline(() => {}, { onCancel: 99 });
      return createElement("div");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("onCancel must be a function");
  });

  it("rejects invalid seek() and setPlaybackRate() values", () => {
    let captured: ReturnType<typeof useTimeline>;
    function Comp(): JSX.Element {
      captured = useTimeline(() => {}, { autoplay: false });
      return createElement("div");
    }
    renderComponent(Comp);

    expect(() => captured.seek(-10)).toThrow(RangeError);
    expect(() => captured.seek(Number.NaN)).toThrow(RangeError);
    expect(() => captured.setPlaybackRate(0)).toThrow(RangeError);
    expect(() => captured.setPlaybackRate(-2)).toThrow(RangeError);
  });
});

describe("Reveal validation", () => {
  it("rejects invalid direction", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid direction
      return createElement(Reveal, { direction: "diagonal" }, "Hello");
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow('direction must be "up", "down", "left", or "right"');
  });

  it("rejects negative duration", () => {
    function Comp(): JSX.Element {
      return createElement(Reveal, { duration: -100 }, "Hello");
    }
    expect(() => renderComponent(Comp)).toThrow(RangeError);
    expect(() => renderComponent(Comp)).toThrow("duration must be a finite number >= 0");
  });

  it("rejects negative delay", () => {
    function Comp(): JSX.Element {
      return createElement(Reveal, { delay: -50 }, "Hello");
    }
    expect(() => renderComponent(Comp)).toThrow(RangeError);
    expect(() => renderComponent(Comp)).toThrow("delay must be a finite number >= 0");
  });
});

describe("AnimatedText validation", () => {
  it("rejects non-string text", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid text
      return createElement(AnimatedText, { text: 12345 });
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("text must be a string");
  });

  it("rejects invalid effect", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid effect
      return createElement(AnimatedText, { text: "Hello", effect: "fly" });
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow('effect must be "typewriter", "scramble", or "gradient"');
  });

  it("rejects non-object effectOptions", () => {
    function Comp(): JSX.Element {
      // @ts-expect-error invalid effectOptions
      return createElement(AnimatedText, { text: "Hello", effect: "typewriter", effectOptions: "fast" as unknown as undefined });
    }
    expect(() => renderComponent(Comp)).toThrow(TypeError);
    expect(() => renderComponent(Comp)).toThrow("effectOptions must be an object");
  });
});
