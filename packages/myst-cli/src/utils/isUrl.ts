export function isUrl(url: string): boolean {
  return !!url.toLowerCase().match(/^https?:\/\//);
}
