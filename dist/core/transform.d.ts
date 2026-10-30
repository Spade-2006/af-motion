/**
 * Sets one effect's contribution to an element's transform. Contributions from different
 * owners are composed in insertion order after the element's original transform, so effects
 * sharing an element neither overwrite nor wipe each other. An empty value keeps the layer
 * registered but contributes nothing.
 */
export declare function setTransformLayer(element: HTMLElement, owner: object, value: string): void;
/**
 * Removes an owner's contribution. When the last layer is removed the original inline
 * transform is restored exactly (or the property removed if there was none).
 */
export declare function removeTransformLayer(element: HTMLElement, owner: object): void;
//# sourceMappingURL=transform.d.ts.map