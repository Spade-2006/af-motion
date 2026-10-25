interface TransformRecord {
  /** Inline transform to restore exactly once the last layer is removed. */
  original: string;
  /** Transform every layer is appended to: the inline one, or the computed one if none is set. */
  base: string;
  layers: Map<object, string>;
}

const records = new WeakMap<HTMLElement, TransformRecord>();

function capture(element: HTMLElement): TransformRecord {
  const original = element.style.transform ?? "";
  let base = original;
  if (base === "" && typeof getComputedStyle === "function") {
    const computed = getComputedStyle(element).transform;
    if (computed && computed !== "none") base = computed;
  }
  return { original, base, layers: new Map() };
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
  else element.style.setProperty("transform", record.original);
}
