import type { JsonObject, NetworkError } from './types';

export const getNetworkError = (json: JsonObject): NetworkError => ({
  status: json?.status ?? 400,
  message: json?.message ?? 'unknown request error',
  errors: json?.errors ? [...json.errors] : [],
});

export function getTags(tags?: string | string[], defaultTags?: string[]): string[] {
  if (!tags) {
    return !defaultTags ? [] : defaultTags;
  }
  if (Array.isArray(tags)) {
    return [...tags];
  }
  return tags.split(',');
}

export function formatTags(tags: string[]) {
  return [...tags];
}

export function ensureString(maybeString: string[] | string | undefined, joinWith = ''): string {
  if (!maybeString) return '';
  if (typeof maybeString === 'string') return maybeString;
  if (maybeString.join) return maybeString.join(joinWith);
  return maybeString as unknown as string;
}

export function tokeniseContent(content: string): string[] {
  let tokens = content.split('\n');
  if (tokens[tokens.length - 1].length === 0) {
    // trailing newline will generate extra token, remove it
    tokens = tokens.slice(0, -1).map((s) => `${s}\n`);
  } else {
    // no trailing inline
    tokens = [...tokens.slice(0, -1).map((s) => `${s}\n`), tokens[tokens.length - 1]];
  }
  return tokens;
}

export function forEachObject<T, O>(
  obj: Record<string, T>,
  func: (keyValue: [string, T]) => [string, O],
): Record<string, O> {
  return Object.fromEntries(Object.entries(obj).map(func));
}
