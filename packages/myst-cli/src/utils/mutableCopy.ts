import type { Draft as Mutable } from 'immer';

/** Return a deep, mutable copy of `value` (for example, frozen store state), without the `omit` keys */
export function mutableCopy<T extends object, K extends keyof T = never>(
  value: T,
  omit: readonly K[] = [],
): Mutable<Omit<T, K>> {
  const copy: Partial<T> = { ...value };
  omit.forEach((key) => {
    delete copy[key];
  });
  return structuredClone(copy) as unknown as Mutable<Omit<T, K>>;
}
