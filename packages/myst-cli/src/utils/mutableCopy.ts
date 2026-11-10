import type { Draft } from 'immer';

/** Return a deep, mutable copy of `value` (for example, frozen store state), without the `omit` keys */
export function mutableCopy<T extends object, K extends keyof T = never>(
  value: T,
  omit: readonly K[] = [],
): Draft<Omit<T, K>> {
  const copy: Partial<T> = { ...value };
  omit.forEach((key) => {
    delete copy[key];
  });
  return structuredClone(copy) as unknown as Draft<Omit<T, K>>;
}
