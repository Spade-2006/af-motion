# af-motion
A modern JavaScript animation and frontend effects toolkit

## Easing

Pass either an easing function or a built-in/registered easing name to `animate`
or `animateProgress`:

```ts
registerEasing("smoothStep", (progress) => progress * progress * (3 - 2 * progress));

animate(element, { opacity: [0, 1] }, {
  duration: 500,
  easing: "smoothStep",
});
```

Use `getEasing(name)` to retrieve a built-in or registered easing. It returns
`undefined` for unknown names; animations using an unknown name throw a `TypeError`.
`removeEasing(name)` removes a custom easing and returns whether one was removed.
Built-in easing names cannot be replaced or removed. Custom registrations with the
same name replace the previous custom function.

## React

The optional `af-motion/react` entry point provides `useAnimate()`. Attach its
`ref` to an element and call the returned `animate` function with the same
properties and options as `animate()`. It returns `AnimationControls`, or `null`
when the ref does not currently point to an element. Active animations are
cancelled automatically when the component unmounts.

```tsx
import { useAnimate } from "af-motion/react";

function FadeIn() {
  const { ref, animate } = useAnimate<HTMLDivElement>();

  return (
    <div
      ref={ref}
      onClick={() => animate({ opacity: [0, 1] }, { duration: 300 })}
    />
  );
}
```

## Animation presets

`animatePreset(target, name, overrides)` runs a built-in or registered preset
through the existing `animate()` engine. Built-ins include `fadeIn`, `fadeOut`,
`slideUp`, `slideDown`, `scaleIn`, and `scaleOut`.

```ts
animatePreset(".card", "slideUp", { duration: 700 });

registerAnimationPreset("popIn", {
  properties: { opacity: [0, 1], transform: ["scale(0.8)", "scale(1)"] },
  options: { duration: 350, easing: "easeOutBack" },
});
```

Use `getAnimationPreset(name)` to retrieve a frozen snapshot and
`removeAnimationPreset(name)` to remove a custom preset. Built-in names cannot
be replaced or removed. Preset timing and callback options can be overridden
per call; stored definitions and caller-owned objects are not mutated.

## Animation timelines

Use `createTimeline()` to add animations at millisecond offsets and then call
`play()`. Offsets can be sequential or overlap, and each step's `options.delay`
is handled by the underlying animation engine. Add labels for reusable positions,
or position a step relative to the preceding step's start or configured end.

```ts
const timeline = createTimeline()
  .addLabel("enter", 0)
  .add({ target: ".card", properties: { opacity: [0, 1] }, at: "enter" })
  .add({
    target: ".card",
    properties: { transform: ["translateY(16px)", "translateY(0px)"] },
    at: { previous: "end", offset: -100 },
    options: { duration: 500, delay: 50 },
  });

timeline.play();
await timeline.finished;
```

The timeline can be paused, resumed, or cancelled; cancellation rejects
`finished` with an `AbortError`.

## Spring animation

`animateSpring()` animates a scalar position toward a target using configurable
stiffness, damping, mass, and initial velocity. It reports position and velocity
on each shared animation frame and calls `onComplete` after settling:

```ts
const spring = animateSpring({
  from: 0,
  to: 1,
  config: { stiffness: 180, damping: 20, mass: 1, initialVelocity: 0 },
  onUpdate: ({ position, velocity }) => console.log(position, velocity),
  onComplete: () => console.log("settled"),
});

spring.cancel();
```

Spring motion respects reduced-motion preferences by completing at the target.
Call `cancel()` to stop updates and release scheduled work.

## Inertia motion

`animateInertia()` starts a scalar position with an initial velocity and applies
exponential friction until the speed falls below `minVelocity`:

```ts
const inertia = animateInertia({
  from: 0,
  initialVelocity: 900,
  friction: 8,
  minVelocity: 10,
  min: 0,
  max: 300,
  onUpdate: ({ position, velocity }) => console.log(position, velocity),
  onComplete: () => console.log("settled"),
});

inertia.cancel();
```

It uses the shared animation-frame scheduler and respects reduced-motion
preferences by completing at the current position without moving. When a
configured bound is reached, position is clamped to that bound and velocity
stops immediately; inertia does not bounce. `cancel()` suppresses later updates
and completion callbacks.

Timelines can also be nested once into a parent at a number, label, or relative
position. Child labels and offsets remain local to the child timeline, while
parent playback controls propagate to nested work:

```ts
const child = createTimeline()
  .addLabel("details", 100)
  .add({ target: ".details", properties: { opacity: [0, 1] }, at: "details" });

const parent = createTimeline().addTimeline(child, 250);
parent.play();
await parent.finished;
```

## Transform composition

`magnetic()`, `tilt()`, and `parallax()` compose their transforms through shared
layers, so these effects can run together on the same element and be destroyed
independently while preserving the element's original transform.

Direct `transform` animation through `animate()`, and the transform-based
`reveal()`/`stagger()` defaults, still write the CSS `transform` property directly.
Avoid combining those on the same element with layered effects: direct writes can
temporarily replace composed layers. The library does not parse arbitrary CSS
transform strings to merge them.

## Reduced motion

`animate()` and `animateProgress()` respect `prefers-reduced-motion` by default.
Animations complete at their current direction's endpoint when reduced motion is
active, including when the preference changes during playback. Set
`respectReducedMotion: false` to opt out. Effects and backgrounds use the shared
motion preference helper and remove their preference listeners when destroyed.

## Scroll triggers

`scrollProgress()` displays the existing fixed progress bar and also exposes the
current normalized progress. Pass `onUpdate` to observe changes; omit the
`target` to track the page or provide an element/selector for a scroll container:

```ts
const progress = scrollProgress({
  target: ".scroll-container",
  onUpdate: (value) => console.log(value),
});

console.log(progress.getProgress());
progress.destroy();
```

Progress is clamped to `0..1`; containers without scrollable distance report `0`.
Updates are batched during normal motion and made immediate when reduced motion is
preferred. Repeated values do not trigger duplicate callbacks.

`scrollVelocity()` reports velocity in pixels per second together with direction,
current position, and normalized progress:

```ts
const velocity = scrollVelocity({
  target: ".scroll-container",
  onUpdate: ({ velocity, direction, position, progress }) => {
    console.log({ velocity, direction, position, progress });
  },
});

velocity.destroy();
```

Velocity becomes `0` when reduced motion is preferred, while direction and position
continue to be measured.

Use `scrollTrigger()` to run callbacks when one element or selector matches enters
or leaves the configured intersection region. It uses `IntersectionObserver` and
returns controls for cleanup:

```ts
const trigger = scrollTrigger(".section", {
  rootMargin: "0px 0px -10% 0px",
  threshold: 0.2,
  once: true,
  onEnter: (element) => console.log("entered", element),
  onLeave: (element) => console.log("left", element),
});

trigger.destroy();
```

By default, each element is observed through its first enter/leave cycle. Set
`once: false` to receive callbacks for subsequent transitions. If
`IntersectionObserver` is unavailable, `scrollTrigger()` throws a descriptive
error.

For the common enter-and-cleanup pattern, use `inView()`:

```ts
const view = inView(".section", (element) => {
  element.classList.add("active");
  return () => element.classList.remove("active");
}, { threshold: 0.2 });

view.destroy();
```

The returned cleanup runs when the element leaves or when `destroy()` is called.
It accepts the same root margin, threshold, and one-time options as `scrollTrigger()`.

## Interactive pointer effects

`pointerGlow()` reuses the radial spotlight overlay, `magneticElement()` attracts
elements within an optional radius, `hoverMotion()` animates composable transform
layers, and `followPointer()` constrains an element to a container:

```ts
const glow = pointerGlow(".card", { color: "#a78bfa", radius: 140 });
const magnet = magneticElement(".button", { strength: 0.25, distance: 120 });
const hover = hoverMotion(".card", { enter: { y: -6, scale: 1.03 } });
const follower = followPointer(".cursor", { container: ".hero", smoothing: 0.12 });

glow.destroy();
magnet.destroy();
hover.destroy();
follower.destroy();
```

The `smoothing` option is measured in seconds (0–1). Pointer effects ignore touch,
respect reduced-motion preferences, and expose `destroy()` to remove listeners and
restore transform styles.
