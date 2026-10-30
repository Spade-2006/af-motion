import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTimeline } from "../src/core/animation-timeline";

class FakeStyle {
  values = new Map<string, string>();
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }
  get(name: string): string | undefined {
    return this.values.get(name);
  }
}

class FakeHTMLElement {
  style = new FakeStyle();
}

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;

function flushFrame(time: number): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
}

function makeElement(): HTMLElement {
  return new FakeHTMLElement() as unknown as HTMLElement;
}

function styleOf(element: HTMLElement): FakeStyle {
  return element.style as unknown as FakeStyle;
}

beforeEach(() => {
  vi.useFakeTimers();
  frames = new Map();
  nextFrameId = 1;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("createTimeline()", () => {
  it("starts steps at their offsets and allows overlap", async () => {
    const first = makeElement();
    const second = makeElement();
    const timeline = createTimeline()
      .add({ target: first, properties: { opacity: [0, 1] }, at: 0, options: { duration: 100 } })
      .add({ target: second, properties: { opacity: [0, 1] }, at: 50, options: { duration: 100 } });
    timeline.play();

    await vi.advanceTimersByTimeAsync(0);
    expect(styleOf(first).get("opacity")).toBe("0");
    expect(styleOf(second).get("opacity")).toBeUndefined();
    flushFrame(0);

    await vi.advanceTimersByTimeAsync(50);
    expect(styleOf(second).get("opacity")).toBe("0");
    flushFrame(50);
    expect(styleOf(first).get("opacity")).toBe("0.5");
    expect(styleOf(second).get("opacity")).toBe("0");

    await vi.advanceTimersByTimeAsync(50);
    flushFrame(100);
    expect(styleOf(first).get("opacity")).toBe("1");
    expect(styleOf(second).get("opacity")).toBe("0.5");
    await vi.advanceTimersByTimeAsync(50);
    flushFrame(150);
    await expect(timeline.finished).resolves.toBeUndefined();
    expect(styleOf(second).get("opacity")).toBe("1");
  });

  it("supports sequential offsets and per-step delays", async () => {
    const element = makeElement();
    const completed: string[] = [];
    const timeline = createTimeline()
      .add({
        target: element,
        properties: { opacity: [0, 1] },
        at: 0,
        options: { duration: 100, onComplete: () => completed.push("first") },
      })
      .add({
        target: element,
        properties: { opacity: [1, 0] },
        at: 100,
        options: { duration: 50, delay: 25, onComplete: () => completed.push("second") },
      });
    timeline.play();

    await vi.advanceTimersByTimeAsync(0);
    flushFrame(0);
    await vi.advanceTimersByTimeAsync(100);
    flushFrame(100);
    expect(completed).toEqual(["first"]);
    expect(styleOf(element).get("opacity")).toBe("1");
    await vi.advanceTimersByTimeAsync(25);
    flushFrame(125);
    expect(styleOf(element).get("opacity")).toBe("1");
    flushFrame(150);
    await vi.advanceTimersByTimeAsync(25);
    flushFrame(175);
    await expect(timeline.finished).resolves.toBeUndefined();
    expect(completed).toEqual(["first", "second"]);
    expect(styleOf(element).get("opacity")).toBe("0");
  });

  it("positions steps at named labels and applies relative offsets", async () => {
    const atLabel = makeElement();
    const afterEnd = makeElement();
    const afterStart = makeElement();
    const timeline = createTimeline()
      .addLabel("entrance", 40)
      .add({
        target: atLabel,
        properties: { opacity: [0, 1] },
        at: { label: "entrance" },
        options: { duration: 40 },
      })
      .add({
        target: afterEnd,
        properties: { opacity: [0, 1] },
        at: { previous: "end", offset: -10 },
        options: { duration: 20 },
      })
      .add({
        target: afterStart,
        properties: { opacity: [0, 1] },
        at: { previous: "start", offset: 20 },
        options: { duration: 20 },
      });
    timeline.play();

    await vi.advanceTimersByTimeAsync(39);
    expect(styleOf(atLabel).get("opacity")).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(styleOf(atLabel).get("opacity")).toBe("0");
    await vi.advanceTimersByTimeAsync(20);
    expect(styleOf(afterStart).get("opacity")).toBeUndefined();
    expect(styleOf(afterEnd).get("opacity")).toBeUndefined();
    await vi.advanceTimersByTimeAsync(10);
    expect(styleOf(afterEnd).get("opacity")).toBe("0");
    flushFrame(70);
    await vi.advanceTimersByTimeAsync(20);
    expect(styleOf(afterStart).get("opacity")).toBe("0");

    flushFrame(90);
    await vi.advanceTimersByTimeAsync(20);
    flushFrame(110);
    await expect(timeline.finished).resolves.toBeUndefined();
  });

  it("supports label references as strings and label offsets", async () => {
    const first = makeElement();
    const second = makeElement();
    const timeline = createTimeline()
      .addLabel("start", 20)
      .add({ target: first, properties: { opacity: [0, 1] }, at: "start", options: { duration: 10 } })
      .add({
        target: second,
        properties: { opacity: [0, 1] },
        at: { label: "start", offset: 30 },
        options: { duration: 10 },
      });
    timeline.play();

    await vi.advanceTimersByTimeAsync(20);
    expect(styleOf(first).get("opacity")).toBe("0");
    await vi.advanceTimersByTimeAsync(30);
    expect(styleOf(second).get("opacity")).toBe("0");
    flushFrame(0);
    flushFrame(10);
    flushFrame(30);
    flushFrame(40);
    await expect(timeline.finished).resolves.toBeUndefined();
  });

  it("nests a timeline while preserving its labels, offsets, and internal delay", async () => {
    const first = makeElement();
    const second = makeElement();
    const child = createTimeline()
      .addLabel("childStart", 20)
      .add({ target: first, properties: { opacity: [0, 1] }, at: "childStart", options: { duration: 20 } })
      .add({
        target: second,
        properties: { opacity: [0, 1] },
        at: { previous: "end", offset: 10 },
        options: { duration: 20, delay: 10 },
      });
    const parent = createTimeline().addTimeline(child, 50);
    parent.play();

    await vi.advanceTimersByTimeAsync(50);
    expect(styleOf(first).get("opacity")).toBeUndefined();
    await vi.advanceTimersByTimeAsync(20);
    expect(styleOf(first).get("opacity")).toBe("0");
    await vi.advanceTimersByTimeAsync(30);
    expect(styleOf(second).get("opacity")).toBe("0");
    flushFrame(0);
    flushFrame(20);
    flushFrame(30);
    await vi.advanceTimersByTimeAsync(30);
    flushFrame(50);
    await expect(parent.finished).resolves.toBeUndefined();
    await expect(child.finished).resolves.toBeUndefined();
  });

  it("positions a nested timeline relative to the previous entry's end", async () => {
    const first = makeElement();
    const second = makeElement();
    const child = createTimeline().add({
      target: second,
      properties: { opacity: [0, 1] },
      at: 10,
      options: { duration: 20 },
    });
    const parent = createTimeline()
      .add({ target: first, properties: { opacity: [0, 1] }, at: 0, options: { duration: 40 } })
      .addTimeline(child, { previous: "end", offset: -10 });
    parent.play();

    await vi.advanceTimersByTimeAsync(30);
    expect(styleOf(second).get("opacity")).toBeUndefined();
    await vi.advanceTimersByTimeAsync(20);
    expect(styleOf(second).get("opacity")).toBe("0");
    flushFrame(0);
    flushFrame(40);
    flushFrame(10);
    flushFrame(30);
    await expect(parent.finished).resolves.toBeUndefined();
  });

  it("propagates pause and resume to active and pending child entries", async () => {
    const active = makeElement();
    const pending = makeElement();
    const child = createTimeline()
      .add({ target: active, properties: { opacity: [0, 1] }, at: 0, options: { duration: 100 } })
      .add({ target: pending, properties: { opacity: [0, 1] }, at: 80, options: { duration: 10 } });
    const parent = createTimeline().addTimeline(child, 0);
    const rejection = expect(parent.finished).rejects.toMatchObject({ name: "AbortError" });
    parent.play();
    await vi.advanceTimersByTimeAsync(0);
    flushFrame(0);
    await vi.advanceTimersByTimeAsync(30);
    flushFrame(30);
    const progressAtPause = styleOf(active).get("opacity");
    parent.pause();
    await vi.advanceTimersByTimeAsync(200);
    expect(styleOf(pending).get("opacity")).toBeUndefined();
    expect(styleOf(active).get("opacity")).toBe(progressAtPause);

    parent.resume();
    await vi.advanceTimersByTimeAsync(50);
    expect(styleOf(pending).get("opacity")).toBe("0");
    flushFrame(330);
    expect(styleOf(active).get("opacity")).not.toBeUndefined();
    parent.cancel();
    await rejection;
  });

  it("propagates cancellation to nested work and child finished promises", async () => {
    const element = makeElement();
    const child = createTimeline().add({
      target: element,
      properties: { opacity: [0, 1] },
      at: 0,
      options: { duration: 100 },
    });
    const parent = createTimeline().addTimeline(child, 0);
    const parentRejection = expect(parent.finished).rejects.toMatchObject({ name: "AbortError" });
    const childRejection = expect(child.finished).rejects.toMatchObject({ name: "AbortError" });
    parent.play();
    await vi.advanceTimersByTimeAsync(1);
    flushFrame(0);
    parent.cancel();
    await Promise.all([parentRejection, childRejection]);
    flushFrame(100);
    expect(styleOf(element).get("opacity")).toBe("0.01");
  });

  it("propagates nested animation errors to the parent", async () => {
    const child = createTimeline().add({
      target: {} as HTMLElement,
      properties: { opacity: [0, 1] },
      at: 0,
    });
    const parent = createTimeline().addTimeline(child, 10);
    const rejection = expect(parent.finished).rejects.toThrow(/HTMLElement/);
    parent.play();
    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
    await expect(child.finished).rejects.toThrow(/HTMLElement/);
  });

  it("rejects circular nesting and reuse across parents", () => {
    const first = createTimeline();
    const second = createTimeline();
    first.addTimeline(second, 0);
    expect(() => second.addTimeline(first, 0)).toThrow(/Circular timeline nesting/);

    const child = createTimeline();
    const parent = createTimeline().addTimeline(child, 0);
    expect(() => createTimeline().addTimeline(child, 0)).toThrow(/only be nested once/);
    expect(() => child.play()).toThrow(/only be played by its parent/);
    expect(parent).toBeDefined();
  });

  it("pauses pending offsets and resumes with the remaining offset", async () => {
    const element = makeElement();
    const timeline = createTimeline().add({
      target: element,
      properties: { opacity: [0, 1] },
      at: 100,
      options: { duration: 20 },
    });
    timeline.play();
    await vi.advanceTimersByTimeAsync(40);
    timeline.pause();
    await vi.advanceTimersByTimeAsync(500);
    expect(styleOf(element).get("opacity")).toBeUndefined();

    timeline.resume();
    await vi.advanceTimersByTimeAsync(59);
    expect(styleOf(element).get("opacity")).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(0);
    await vi.advanceTimersByTimeAsync(20);
    flushFrame(20);
    await expect(timeline.finished).resolves.toBeUndefined();
  });

  it("pauses and resumes animations already in progress", async () => {
    const element = makeElement();
    const timeline = createTimeline().add({
      target: element,
      properties: { opacity: [0, 1] },
      at: 0,
      options: { duration: 100 },
    });
    timeline.play();
    await vi.advanceTimersByTimeAsync(0);
    flushFrame(0);
    await vi.advanceTimersByTimeAsync(25);
    timeline.pause();
    await vi.advanceTimersByTimeAsync(200);
    timeline.resume();
    await vi.advanceTimersByTimeAsync(75);
    flushFrame(300);

    await expect(timeline.finished).resolves.toBeUndefined();
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("cancels active and pending animations and rejects finished", async () => {
    const active = makeElement();
    const pending = makeElement();
    const timeline = createTimeline()
      .add({ target: active, properties: { opacity: [0, 1] }, at: 0, options: { duration: 100 } })
      .add({ target: pending, properties: { opacity: [0, 1] }, at: 100 });
    const rejection = expect(timeline.finished).rejects.toMatchObject({ name: "AbortError" });
    timeline.play();
    await vi.advanceTimersByTimeAsync(0);
    flushFrame(0);
    timeline.cancel();
    timeline.cancel();
    await rejection;
    await vi.advanceTimersByTimeAsync(200);
    flushFrame(100);

    expect(styleOf(pending).get("opacity")).toBeUndefined();
    expect(styleOf(active).get("opacity")).toBe("0");
  });

  it("settles cancellation and cleans every entry when onCancel callbacks throw", async () => {
    const firstCancel = vi.fn(() => { throw new Error("first cleanup failed"); });
    const secondCancel = vi.fn(() => { throw new Error("second cleanup failed"); });
    const timeline = createTimeline()
      .add({
        target: makeElement(),
        properties: { opacity: [0, 1] },
        at: 0,
        options: { duration: 100, onCancel: firstCancel },
      })
      .add({
        target: makeElement(),
        properties: { opacity: [0, 1] },
        at: 0,
        options: { duration: 100, onCancel: secondCancel },
      });
    const rejection = expect(timeline.finished).rejects.toMatchObject({
      name: "AggregateError",
      errors: expect.arrayContaining([
        expect.objectContaining({ name: "AbortError" }),
        expect.objectContaining({ name: "AggregateError" }),
      ]),
    });

    timeline.play();
    await vi.advanceTimersByTimeAsync(0);
    flushFrame(0);
    expect(() => timeline.cancel()).not.toThrow();
    await rejection;

    expect(firstCancel).toHaveBeenCalledOnce();
    expect(secondCancel).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
  });

  it("rejects finished when a step fails", async () => {
    const timeline = createTimeline().add({
      target: {} as HTMLElement,
      properties: { opacity: [0, 1] },
      at: 0,
    });
    const rejection = expect(timeline.finished).rejects.toThrow(/HTMLElement/);
    timeline.play();
    await vi.advanceTimersByTimeAsync(0);
    await rejection;
  });

  it("resolves an empty timeline when played", async () => {
    const timeline = createTimeline();
    timeline.play();
    await expect(timeline.finished).resolves.toBeUndefined();
  });

  it("seeks before play and starts steps at the requested playhead", async () => {
    const element = makeElement();
    const timeline = createTimeline().add({
      target: element,
      properties: { opacity: [0, 1] },
      at: 0,
      options: { duration: 100 },
    });
    timeline.seek(40);
    timeline.play();

    await vi.advanceTimersByTimeAsync(0);
    expect(styleOf(element).get("opacity")).toBe("0.4");
    flushFrame(0);
    await vi.advanceTimersByTimeAsync(60);
    flushFrame(60);
    await expect(timeline.finished).resolves.toBeUndefined();
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("seeks a running animation immediately and resumes from that point", async () => {
    const element = makeElement();
    const timeline = createTimeline().add({
      target: element,
      properties: { opacity: [0, 1] },
      at: 0,
      options: { duration: 100 },
    });
    timeline.play();
    await vi.advanceTimersByTimeAsync(0);
    flushFrame(0);
    timeline.seek(60);
    expect(styleOf(element).get("opacity")).toBe("0.6");
    await vi.advanceTimersByTimeAsync(40);
    flushFrame(40);

    await expect(timeline.finished).resolves.toBeUndefined();
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("seeks nested timelines to the corresponding child time", async () => {
    const element = makeElement();
    const child = createTimeline().add({
      target: element,
      properties: { opacity: [0, 1] },
      at: 0,
      options: { duration: 100 },
    });
    const parent = createTimeline().addTimeline(child, 20);
    parent.play();
    await vi.advanceTimersByTimeAsync(21);
    flushFrame(0);
    parent.seek(70);
    expect(styleOf(element).get("opacity")).toBe("0.5");
    parent.cancel();
    await expect(parent.finished).rejects.toMatchObject({ name: "AbortError" });
  });

  it("restarts from zero with a fresh finished promise", async () => {
    const element = makeElement();
    const timeline = createTimeline().add({
      target: element,
      properties: { opacity: [0, 1] },
      at: 0,
      options: { duration: 10 },
    });
    const firstRun = timeline.finished;
    timeline.play();
    await vi.advanceTimersByTimeAsync(0);
    flushFrame(0);
    await vi.advanceTimersByTimeAsync(10);
    flushFrame(10);
    await expect(firstRun).resolves.toBeUndefined();

    timeline.restart();
    const secondRun = timeline.finished;
    expect(secondRun).not.toBe(firstRun);
    await vi.advanceTimersByTimeAsync(0);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(0);
    await vi.advanceTimersByTimeAsync(10);
    flushFrame(10);
    await expect(secondRun).resolves.toBeUndefined();
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("restarts an active run and rejects only its previous finished promise", async () => {
    const element = makeElement();
    const timeline = createTimeline().add({
      target: element,
      properties: { opacity: [0, 1] },
      at: 0,
      options: { duration: 100 },
    });
    const firstRun = timeline.finished;
    const firstRunRejection = expect(firstRun).rejects.toMatchObject({ name: "AbortError" });
    timeline.play();
    await vi.advanceTimersByTimeAsync(0);
    flushFrame(0);
    await vi.advanceTimersByTimeAsync(25);
    flushFrame(25);
    expect(styleOf(element).get("opacity")).toBe("0.25");

    timeline.restart();
    await firstRunRejection;
    expect(timeline.finished).not.toBe(firstRun);
    await vi.advanceTimersByTimeAsync(0);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(25);
    await vi.advanceTimersByTimeAsync(100);
    flushFrame(125);
    await expect(timeline.finished).resolves.toBeUndefined();
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("does not let a prior completion settle a reentrant restarted run", async () => {
    const element = makeElement();
    let restarted = false;
    let timeline!: ReturnType<typeof createTimeline>;
    const onComplete = vi.fn(() => {
      if (!restarted) {
        restarted = true;
        timeline.restart();
      }
    });
    timeline = createTimeline().add({
      target: element,
      properties: { opacity: [0, 1] },
      at: 0,
      options: { duration: 10, onComplete },
    });
    const firstRun = timeline.finished;
    const firstRunRejection = expect(firstRun).rejects.toMatchObject({ name: "AbortError" });
    timeline.play();
    await vi.advanceTimersByTimeAsync(0);
    flushFrame(0);
    await vi.advanceTimersByTimeAsync(10);
    flushFrame(10);
    await firstRunRejection;
    const restartedRun = timeline.finished;
    let restartedSettled = false;
    restartedRun.then(() => {
      restartedSettled = true;
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(0);
    expect(styleOf(element).get("opacity")).toBe("0");
    expect(restartedSettled).toBe(false);
    flushFrame(10);
    await vi.advanceTimersByTimeAsync(10);
    flushFrame(20);
    await expect(restartedRun).resolves.toBeUndefined();
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("applies playback rate to offsets and active animations", async () => {
    const element = makeElement();
    const timeline = createTimeline().add({
      target: element,
      properties: { opacity: [0, 1] },
      at: 100,
      options: { duration: 100 },
    });
    expect(timeline.getPlaybackRate()).toBe(1);
    timeline.setPlaybackRate(2);
    expect(timeline.getPlaybackRate()).toBe(2);
    timeline.play();
    await vi.advanceTimersByTimeAsync(50);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(0);
    flushFrame(50);
    await expect(timeline.finished).resolves.toBeUndefined();
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("scales step delays with the timeline playback rate", async () => {
    const element = makeElement();
    const onStart = vi.fn();
    const timeline = createTimeline().add({
      target: element,
      properties: { opacity: [0, 1] },
      at: 0,
      options: { delay: 100, duration: 100, onStart },
    });
    timeline.setPlaybackRate(2);
    timeline.play();
    await vi.advanceTimersByTimeAsync(0);
    flushFrame(0);
    await vi.advanceTimersByTimeAsync(49);
    flushFrame(49);
    expect(onStart).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    flushFrame(50);
    expect(onStart).toHaveBeenCalledTimes(1);
    timeline.cancel();
    await expect(timeline.finished).rejects.toMatchObject({ name: "AbortError" });
  });

  it("changes playback rate without a progress jump", async () => {
    const element = makeElement();
    const timeline = createTimeline().add({
      target: element,
      properties: { opacity: [0, 1] },
      at: 0,
      options: { duration: 100 },
    });
    timeline.play();
    await vi.advanceTimersByTimeAsync(0);
    flushFrame(0);
    await vi.advanceTimersByTimeAsync(25);
    flushFrame(25);
    expect(styleOf(element).get("opacity")).toBe("0.25");

    timeline.setPlaybackRate(2);
    expect(styleOf(element).get("opacity")).toBe("0.25");
    await vi.advanceTimersByTimeAsync(25);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.75");
    timeline.cancel();
    await expect(timeline.finished).rejects.toMatchObject({ name: "AbortError" });
  });

  it("can seek back into a completed nested timeline", async () => {
    const element = makeElement();
    const child = createTimeline().add({
      target: element,
      properties: { opacity: [0, 1] },
      at: 10,
      options: { duration: 100 },
    });
    const parent = createTimeline()
      .addTimeline(child, 10)
      .add({
        target: makeElement(),
        properties: { opacity: [0, 1] },
        at: 500,
      });
    parent.play();
    await vi.advanceTimersByTimeAsync(20);
    flushFrame(20);
    expect(styleOf(element).get("opacity")).toBe("0");
    await vi.advanceTimersByTimeAsync(100);
    flushFrame(120);
    expect(styleOf(element).get("opacity")).toBe("1");

    parent.seek(70);
    const restartedChildRun = child.finished;
    await vi.advanceTimersByTimeAsync(0);
    expect(styleOf(element).get("opacity")).toBe("0.5");
    flushFrame(120);
    await vi.advanceTimersByTimeAsync(50);
    flushFrame(170);
    await expect(restartedChildRun).resolves.toBeUndefined();
    parent.cancel();
    await expect(parent.finished).rejects.toMatchObject({ name: "AbortError" });
  });

  it("rejects invalid seek times and playback rates and forbids seeking after completion", async () => {
    const timeline = createTimeline().add({
      target: makeElement(),
      properties: { opacity: [0, 1] },
      at: 0,
      options: { duration: 0 },
    });
    expect(() => timeline.seek(-1)).toThrow(RangeError);
    expect(() => timeline.seek(Number.NaN)).toThrow(RangeError);
    expect(() => timeline.setPlaybackRate(0)).toThrow(RangeError);
    expect(() => timeline.setPlaybackRate(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    timeline.play();
    await vi.advanceTimersByTimeAsync(0);
    flushFrame(0);
    await expect(timeline.finished).resolves.toBeUndefined();
    expect(() => timeline.seek(0)).toThrow(/completed timeline/);
    timeline.restart();
    timeline.cancel();
    await expect(timeline.finished).rejects.toMatchObject({ name: "AbortError" });
  });

  it("rejects invalid offsets and prevents adding after playback starts", () => {
    const timeline = createTimeline();
    expect(() =>
      timeline.add({ target: makeElement(), properties: { opacity: [0, 1] }, at: -1 }),
    ).toThrow(RangeError);
    expect(() =>
      timeline.add({ target: makeElement(), properties: { opacity: [0, 1] }, at: Number.NaN }),
    ).toThrow(RangeError);
    timeline.play();
    expect(() =>
      timeline.add({ target: makeElement(), properties: { opacity: [0, 1] }, at: 0 }),
    ).toThrow(/after timeline playback/);
  });

  it("rejects invalid labels and unresolved or invalid relative references", async () => {
    const timeline = createTimeline();
    expect(() => timeline.addLabel("", 0)).toThrow(/Invalid timeline label/);
    expect(() => timeline.addLabel("bad label", 0)).toThrow(/Invalid timeline label/);
    expect(() => timeline.addLabel("negative", -1)).toThrow(RangeError);
    expect(() => timeline.addLabel("infinite", Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => timeline.addLabel("valid", 0).addLabel("valid", 1)).toThrow(/already defined/);

    timeline.add({
      target: makeElement(),
      properties: { opacity: [0, 1] },
      at: { label: "missing" },
    });
    const rejection = expect(timeline.finished).rejects.toThrow(/Unresolved timeline label "missing"/);
    timeline.play();
    await rejection;

    const firstRelative = createTimeline().add({
      target: makeElement(),
      properties: { opacity: [0, 1] },
      at: { previous: "end" },
    });
    const relativeRejection = expect(firstRelative.finished).rejects.toThrow(/first timeline entry/);
    firstRelative.play();
    await relativeRejection;
  });
});
