export type ResolvedBaseUrl = {
  pathname?: string;
  publicUrl?: string;
};

/**
 * Resolve a deployment path or absolute public URL from BASE_URL-style input.
 */
export function resolveBaseUrl(value?: string, source = 'BASE_URL'): ResolvedBaseUrl {
  if (!value) return {};
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { pathname: value.replace(/\/+$/, '') || undefined };
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.search || url.hash) {
    throw new Error(
      `${source} must be an absolute http(s) URL without a query or fragment: ${value}`,
    );
  }
  return {
    pathname: url.pathname.replace(/\/+$/, '') || undefined,
    publicUrl: url.href.replace(/\/+$/, ''),
  };
}
