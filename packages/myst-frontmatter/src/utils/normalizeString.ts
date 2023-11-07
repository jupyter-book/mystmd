export function normalizeJsonToString(value: Record<string, any>) {
  return JSON.stringify(
    Object.entries(value)
      .filter(([, val]) => val !== undefined)
      .sort(),
  );
}
