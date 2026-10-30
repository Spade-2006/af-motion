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
  if (parts.length === 0) element.style.removeProperty("transform");
  else element.style.setProperty("transform", parts.join(" "));
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
  const value = element.style.getPropertyValue("transform");
  return {
    value: value === "" ? null : value,
    priority: element.style.getPropertyPriority("transform"),
  };
}

export function setTransformBase(
  element: HTMLElement,
  value: string | null,
  priority = "",
): void {
  const record = records.get(element);
  if (!record) {
    if (value === null) element.style.removeProperty("transform");
    else element.style.setProperty("transform", value, priority);
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
  if (record.original === "") element.style.removeProperty("transform");
  else element.style.setProperty("transform", record.original, record.originalPriority);
}
