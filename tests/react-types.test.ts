// @vitest-environment jsdom

import { createElement, useRef } from "react";
import type { RefObject } from "react";
import { describe, expectTypeOf, it } from "vitest";
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
  type AnimatedTextBaseProps,
  type AnimatedTextProps,
  type ReactAnimationTimelineControls,
  type ReactAnimateTarget,
  type RevealProps,
  type UseAnimateCallback,
  type UseAnimateResult,
  type UseInViewOptions,
  type UseInViewResult,
  type UseParallelOptions,
  type UseParallelResult,
  type UseParallelStep,
  type UseScrollProgressOptions,
  type UseScrollProgressResult,
  type UseScrollVelocityOptions,
  type UseScrollVelocityResult,
  type UseSequenceOptions,
  type UseSequenceResult,
  type UseSequenceStep,
  type UseTimelineOptions,
  type UseTimelineResult,
  type UseTimelineStep,
} from "../src/react";

describe("React TypeScript ergonomics and type inference", () => {
  it("infers HTMLElement and SVGElement ref types for useAnimate", () => {
    function Comp() {
      // Default to HTMLElement
      const defaultAnimate = useAnimate();
      expectTypeOf(defaultAnimate).toEqualTypeOf<UseAnimateResult<HTMLElement>>();
      expectTypeOf(defaultAnimate.ref).toEqualTypeOf<RefObject<HTMLElement | null>>();
      expectTypeOf(defaultAnimate.animate).toEqualTypeOf<UseAnimateCallback>();

      // Explicit HTMLButtonElement
      const btnAnimate = useAnimate<HTMLButtonElement>();
      expectTypeOf(btnAnimate.ref).toEqualTypeOf<RefObject<HTMLButtonElement | null>>();

      // Explicit SVGElement
      const svgAnimate = useAnimate<SVGSVGElement>();
      expectTypeOf(svgAnimate.ref).toEqualTypeOf<RefObject<SVGSVGElement | null>>();

      // Explicit SVGPathElement
      const pathAnimate = useAnimate<SVGPathElement>();
      expectTypeOf(pathAnimate.ref).toEqualTypeOf<RefObject<SVGPathElement | null>>();

      return null;
    }

    expectTypeOf(Comp).toBeFunction();
  });

  it("infers HTMLElement and SVGElement ref and target types for useInView", () => {
    function Comp() {
      const defaultInView = useInView();
      expectTypeOf(defaultInView).toEqualTypeOf<UseInViewResult<HTMLElement>>();
      expectTypeOf(defaultInView.isInView).toBeBoolean();

      const svgInView = useInView<SVGSVGElement>();
      expectTypeOf(svgInView.ref).toEqualTypeOf<RefObject<SVGSVGElement | null>>();

      const divRef = useRef<HTMLDivElement>(null);
      const pathRef = useRef<SVGPathElement>(null);

      // Target accepts HTML ref, SVG ref, string selector, or element
      const targetHtml = useInView({ target: divRef });
      const targetSvg = useInView({ target: pathRef });
      const targetSelector = useInView({ target: ".card" });

      expectTypeOf(targetHtml.isInView).toBeBoolean();
      expectTypeOf(targetSvg.isInView).toBeBoolean();
      expectTypeOf(targetSelector.isInView).toBeBoolean();

      // Callback type validation
      const withCallbacks: UseInViewOptions = {
        onEnter: (el, entry) => {
          expectTypeOf(el).toEqualTypeOf<HTMLElement>();
          expectTypeOf(entry).toEqualTypeOf<IntersectionObserverEntry>();
          return () => {};
        },
        onLeave: (el, entry) => {
          expectTypeOf(el).toEqualTypeOf<HTMLElement>();
          expectTypeOf(entry).toEqualTypeOf<IntersectionObserverEntry>();
        },
        onChange: (inView, el, entry) => {
          expectTypeOf(inView).toBeBoolean();
          expectTypeOf(el).toEqualTypeOf<HTMLElement>();
          expectTypeOf(entry).toEqualTypeOf<IntersectionObserverEntry>();
        },
      };
      expectTypeOf(withCallbacks).toBeObject();

      return null;
    }

    expectTypeOf(Comp).toBeFunction();
  });

  it("infers HTMLElement and SVGElement types for useScrollProgress and useScrollVelocity", () => {
    function Comp() {
      const scrollDefault = useScrollProgress();
      expectTypeOf(scrollDefault).toEqualTypeOf<UseScrollProgressResult<HTMLElement>>();
      expectTypeOf(scrollDefault.progress).toBeNumber();
      expectTypeOf(scrollDefault.getProgress()).toBeNumber();

      const svgScroll = useScrollProgress<SVGSVGElement>();
      expectTypeOf(svgScroll.ref).toEqualTypeOf<RefObject<SVGSVGElement | null>>();

      const divRef = useRef<HTMLDivElement>(null);
      const svgRef = useRef<SVGSVGElement>(null);

      // Target accepts "window", HTML ref, SVG ref, or selector
      const progressWindow = useScrollProgress({ target: "window" });
      const progressHtml = useScrollProgress({ target: divRef });
      const progressSvg = useScrollProgress({ target: svgRef });
      expectTypeOf(progressWindow.progress).toBeNumber();
      expectTypeOf(progressHtml.progress).toBeNumber();
      expectTypeOf(progressSvg.progress).toBeNumber();

      const velocityDefault = useScrollVelocity();
      expectTypeOf(velocityDefault).toEqualTypeOf<UseScrollVelocityResult<HTMLElement>>();
      expectTypeOf(velocityDefault.data.velocity).toBeNumber();
      expectTypeOf(velocityDefault.data.direction).toEqualTypeOf<"up" | "down" | "left" | "right" | "idle">();
      expectTypeOf(velocityDefault.getData()).toEqualTypeOf(velocityDefault.data);

      const velocitySvg = useScrollVelocity<SVGSVGElement>({ target: svgRef });
      expectTypeOf(velocitySvg.ref).toEqualTypeOf<RefObject<SVGSVGElement | null>>();

      return null;
    }

    expectTypeOf(Comp).toBeFunction();
  });

  it("supports HTML and SVG RefObjects across useSequence and useParallel step definitions", () => {
    function Comp() {
      const htmlRef = useRef<HTMLDivElement>(null);
      const svgRef = useRef<SVGSVGElement>(null);
      const pathRef = useRef<SVGPathElement>(null);

      const sequenceSteps: UseSequenceStep[] = [
        { target: htmlRef, properties: { opacity: [0, 1] } },
        { target: svgRef, properties: { transform: ["scale(0.8)", "scale(1)"] } },
        { target: pathRef, properties: { opacity: [0.5, 1] } },
        { target: "#selector", properties: { opacity: [0, 1] } },
      ];

      const seq = useSequence(sequenceSteps);
      expectTypeOf(seq).toEqualTypeOf<UseSequenceResult>();
      expectTypeOf(seq.play).toBeFunction();
      expectTypeOf(seq.finished).toEqualTypeOf<Promise<void> | null>();

      const parallelSteps: UseParallelStep[] = [
        { target: htmlRef, properties: { opacity: [0, 1] } },
        { target: svgRef, properties: { transform: ["rotate(0deg)", "rotate(90deg)"] } },
      ];

      const par = useParallel(parallelSteps);
      expectTypeOf(par).toEqualTypeOf<UseParallelResult>();
      expectTypeOf(par.play).toBeFunction();
      expectTypeOf(par.finished).toEqualTypeOf<Promise<void> | null>();

      return null;
    }

    expectTypeOf(Comp).toBeFunction();
  });

  it("provides type-safe chaining and RefObject support in useTimeline", () => {
    function Comp() {
      const boxRef = useRef<HTMLDivElement>(null);
      const iconRef = useRef<SVGSVGElement>(null);

      const tlResult = useTimeline((tl) => {
        expectTypeOf(tl).toEqualTypeOf<ReactAnimationTimelineControls>();

        // Type-safe step definitions supporting HTML and SVG RefObjects
        tl.add({
          at: 0,
          target: boxRef,
          properties: { opacity: [0, 1] },
          options: { duration: 200 },
        }).add({
          at: 100,
          target: iconRef,
          properties: { transform: ["scale(0)", "scale(1)"] },
        }).add({
          at: 200,
          target: "#icon-path",
          properties: { opacity: [0, 1] },
        }).addLabel("midpoint", 150);
      });

      expectTypeOf(tlResult).toEqualTypeOf<UseTimelineResult>();
      expectTypeOf(tlResult.timeline).toEqualTypeOf<ReactAnimationTimelineControls | null>();
      expectTypeOf(tlResult.seek).toBeFunction();
      expectTypeOf(tlResult.restart).toBeFunction();

      return null;
    }

    expectTypeOf(Comp).toBeFunction();
  });

  it("preserves native HTML attributes and ref types on Reveal", () => {
    const props: RevealProps = {
      children: "Reveal text",
      direction: "down",
      duration: 500,
      id: "hero-reveal",
      className: "custom-reveal-class",
      style: { margin: 16 },
      tabIndex: 0,
      onClick: (e) => {
        expectTypeOf(e.currentTarget).toEqualTypeOf<HTMLDivElement>();
      },
      "aria-label": "Hero section",
      "data-testid": "hero-div",
    };

    expectTypeOf(props.id).toEqualTypeOf<string | undefined>();
    expectTypeOf(props.direction).toEqualTypeOf<"up" | "down" | "left" | "right" | undefined>();

    const el = createElement(Reveal, props);
    expectTypeOf(el).toBeObject();
  });

  it("discriminates effectOptions and preserves HTMLSpanElement attributes on AnimatedText", () => {
    // Discriminated union typewriter
    const typewriterProps: AnimatedTextProps = {
      text: "Typewriter text",
      effect: "typewriter",
      effectOptions: { speed: 50, loop: true },
      className: "typewriter-span",
      id: "typewriter-1",
      onClick: (e) => {
        expectTypeOf(e.currentTarget).toEqualTypeOf<HTMLSpanElement>();
      },
    };
    expectTypeOf(typewriterProps.effect).toEqualTypeOf<"typewriter">();

    // Discriminated union scramble
    const scrambleProps: AnimatedTextProps = {
      text: "Scramble text",
      effect: "scramble",
      effectOptions: { duration: 1000, characters: "!@#$" },
      style: { color: "blue" },
    };
    expectTypeOf(scrambleProps.effect).toEqualTypeOf<"scramble">();

    // Discriminated union gradient
    const gradientProps: AnimatedTextProps = {
      text: "Gradient text",
      effect: "gradient",
      effectOptions: { colors: ["#ff0000", "#0000ff"] },
    };
    expectTypeOf(gradientProps.effect).toEqualTypeOf<"gradient">();

    // Exported AnimatedTextBaseProps
    expectTypeOf<AnimatedTextBaseProps["text"]>().toBeString();
  });
});
