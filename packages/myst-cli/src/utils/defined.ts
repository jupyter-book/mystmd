export function defined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function notNullish<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}
