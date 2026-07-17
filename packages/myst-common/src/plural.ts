/**
 * Creates a plural version of a string to log to the console.
 *
 * `plural('%s book(s)', books)`
 *
 * `plural('%s stitch(es)', 3)`
 *
 * `plural('%s dependenc(y|ies)', deps)`
 *
 *
 * If passed an object as the second argument, the number of keys will be used.
 */
export function plural(f: string, count?: number | any[] | Record<any, any>): string {
  const num =
    (typeof count === 'number'
      ? count
      : Array.isArray(count)
        ? count?.length
        : Object.keys(count ?? {}).length) ?? 0;
  return f
    .replace('%s', String(num))
    .replace(/\((?:([a-z0-9A-Z-]*)\|)?([a-z0-9A-Z-]*)\)/g, num === 1 ? '$1' : '$2');
}
