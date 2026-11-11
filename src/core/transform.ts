interface TransformRecord {
  /** Inline transform to restore exactly once the last layer is removed. */
  original: string;
  originalPriority: string;
  /** Transform every layer is appended to: the inline one, or the computed one if none is set. */
  base: string;
  computedBase: string;
  layers: Map<object, string>;
}

const records = new WeakMap<HTMLElement, TransformRecord>();

function capture(element: HTMLElement): TransformRecord {
  const original = element.style.transform ?? "";
  const originalPriority = typeof element.style.getPropertyPriority === "function"
    ? element.style.getPropertyPriority("transform")
    : "";
  let base = original;
  let computedBase = "";
  if (base === "" && typeof getComputedStyle === "function") {
    const computed = getComputedStyle(element).transform;
    if (computed && computed !== "none") {
      base = computed;
      computedBase = computed;
    }
  }
  return { original, originalPriority, base, computedBase, layers: new Map() };
}

function write(element: HTMLElement, record: TransformRecord): void {
  const parts = [record.base, ...record.layers.values()].filter((part) => part !== "");
  if (parts.length === 0) {
    if (typeof element.style.removeProperty === "function") element.style.removeProperty("transform");
    else delete (element.style as unknown as Record<string, string>)["transform"];
  } else {
    if (typeof element.style.setProperty === "function") element.style.setProperty("transform", parts.join(" "), record.originalPriority);
    else (element.style as unknown as Record<string, string>)["transform"] = parts.join(" ");
  }
}

/**
 * Sets one effect's contribution to an element's transform. Contributions from different
 * owners are composed in insertion order after the element's original transform, so effects
 * sharing an element neither overwrite nor wipe each other. An empty value keeps the layer
 * registered but contributes nothing.
 */
export function setTransformLayer(element: HTMLElement, owner: object, value: string): void {
  let record = records.get(element);
  if (!record) {
    record = capture(element);
    records.set(element, record);
  }
  record.layers.set(owner, value);
  write(element, record);
}

export function getTransformBase(element: HTMLElement): { value: string | null; priority: string } {
  const record = records.get(element);
  if (record) {
    return {
      value: record.original === "" ? null : record.original,
      priority: record.originalPriority,
    };
  }
  const value = typeof element.style.getPropertyValue === "function"
    ? element.style.getPropertyValue("transform")
    : (element.style as unknown as Record<string, string>)["transform"] ?? "";
  const priority = typeof element.style.getPropertyPriority === "function"
    ? element.style.getPropertyPriority("transform")
    : "";
  return {
    value: value === "" ? null : value,
    priority,
  };
}

export function setTransformBase(
  element: HTMLElement,
  value: string | null,
  priority = "",
): void {
  const record = records.get(element);
  if (!record) {
    if (value === null) {
      if (typeof element.style.removeProperty === "function") element.style.removeProperty("transform");
      else delete (element.style as unknown as Record<string, string>)["transform"];
    } else {
      if (typeof element.style.setProperty === "function") element.style.setProperty("transform", value, priority);
      else (element.style as unknown as Record<string, string>)["transform"] = value;
    }
    return;
  }

  record.original = value ?? "";
  record.originalPriority = priority;
  record.base = value ?? record.computedBase;
  write(element, record);
}

/**
 * Removes an owner's contribution. When the last layer is removed the original inline
 * transform is restored exactly (or the property removed if there was none).
 */
export function removeTransformLayer(element: HTMLElement, owner: object): void {
  const record = records.get(element);
  if (!record?.layers.delete(owner)) return;
  if (record.layers.size > 0) {
    write(element, record);
    return;
  }
  records.delete(element);
  if (record.original === "") {
    if (typeof element.style.removeProperty === "function") element.style.removeProperty("transform");
    else delete (element.style as unknown as Record<string, string>)["transform"];
  } else {
    if (typeof element.style.setProperty === "function") element.style.setProperty("transform", record.original, record.originalPriority);
    else (element.style as unknown as Record<string, string>)["transform"] = record.original;
  }
}

interface InlineStyleValue {
  value: string;
  priority: string;
}

interface EffectTargetRecord {
  count: number;
  position: InlineStyleValue;
  isolation: InlineStyleValue;
  restorePosition: boolean;
  restoreIsolation: boolean;
}

const effectTargetRecords = new WeakMap<HTMLElement, EffectTargetRecord>();

function readInlineStyle(element: HTMLElement, property: string): InlineStyleValue {
  return {
    value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  };
}

function restoreInlineStyle(element: HTMLElement, property: string, original: InlineStyleValue): void {
  if (original.value === "") element.style.removeProperty(property);
  else element.style.setProperty(property, original.value, original.priority);
}

/**
 * Prepares a container element for overlay effects (e.g. borderBeam, ripple, shine, spotlight),
 * ensuring relative positioning and isolation without clobbering other active effects on the container.
 */
export function acquireEffectTarget(element: HTMLElement): void {
  const current = effectTargetRecords.get(element);
  if (current) {
    current.count++;
    return;
  }

  const position = readInlineStyle(element, "position");
  const isolation = readInlineStyle(element, "isolation");
  const computed = typeof getComputedStyle === "function" ? getComputedStyle(element) : undefined;
  const restorePosition = (computed?.position ?? (position.value || "static")) === "static";
  const restoreIsolation = (computed?.isolation ?? isolation.value) !== "isolate";
  if (restorePosition) element.style.setProperty("position", "relative");
  if (restoreIsolation) element.style.setProperty("isolation", "isolate");
  effectTargetRecords.set(element, { count: 1, position, isolation, restorePosition, restoreIsolation });
}

/**
 * Releases a container element acquired by an overlay effect. Styles are restored only once
 * all overlay effects sharing the element have been released.
 */
export function releaseEffectTarget(element: HTMLElement): void {
  const record = effectTargetRecords.get(element);
  if (!record) return;
  record.count--;
  if (record.count > 0) return;

  effectTargetRecords.delete(element);
  if (record.restorePosition) restoreInlineStyle(element, "position", record.position);
  if (record.restoreIsolation) restoreInlineStyle(element, "isolation", record.isolation);
}
