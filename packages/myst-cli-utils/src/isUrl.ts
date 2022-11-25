export function isUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol.includes('http');
  } catch (error) {
    return false;
  }
}
