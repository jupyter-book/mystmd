import { JsonObject, NetworkError } from './types';

export const getNetworkError = (json: JsonObject): NetworkError => ({
  status: json?.status ?? 400,
  message: json?.message ?? 'unknown request error',
  errors: json?.errors ? [...json.errors] : [],
});

export function getDate(object: undefined | Date | string | { toDate: () => Date }): Date {
  if (object == null) {
    return new Date();
  }
  if (object instanceof Date) {
    return object;
  }
  if (typeof object === 'string') {
    return new Date(object);
  }
  if (object?.toDate !== undefined) {
    return object.toDate();
  }
  throw new Error(`Could not parse date: ${object}`);
}

export function formatDate(date: Date | { toDate: () => Date }): string {
  if (date instanceof Date) {
    return date.toISOString();
  }
  if (date?.toDate !== undefined) {
    return date.toDate().toISOString();
  }
  if (typeof date === 'string') {
    return formatDate(getDate(date));
  }
  return null as any; // This will parse in JS into a Date.now()
}

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
