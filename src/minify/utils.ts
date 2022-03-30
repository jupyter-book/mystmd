export const MAX_CHARS = 25000;
export const TRUNCATED_CHARS_COUNT = 64;

export function isNotNull<T>(arg: T | null): arg is T {
  return arg != null;
}

export function ensureSafePath(path: string): string {
  return path.replace('/', '-');
}
