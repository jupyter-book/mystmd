/** Normalize an absolute public site URL, without trailing slashes. */
export function normalizeSiteUrl(value: string, source = 'site URL'): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${source} must be an absolute http(s) URL: ${value}`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${source} must use http or https: ${value}`);
  }
  if (url.search || url.hash) {
    throw new Error(`${source} must not include a query string or fragment: ${value}`);
  }
  return url.href.replace(/\/+$/, '');
}

export type SiteUrlOptions = {
  /** The site.url configuration value. */
  url?: string;
  /** Deployment-time environment overrides, supplied by the caller. */
  env?: {
    SITE_URL?: string;
    BASE_URL?: string;
    READTHEDOCS_CANONICAL_URL?: string;
  };
};

/** Resolve public and routing URLs, validating that their deployment paths agree. */
export function resolveSiteUrls({ url, env = {} }: SiteUrlOptions = {}): {
  siteUrl: string | undefined;
  baseUrl: string | undefined;
} {
  // SITE_URL takes precedence, followed by site.url and then Read the Docs.
  const source = env.SITE_URL ? 'SITE_URL' : url ? 'site.url' : 'READTHEDOCS_CANONICAL_URL';
  const value = env.SITE_URL || url || env.READTHEDOCS_CANONICAL_URL;
  const siteUrl = value ? normalizeSiteUrl(value, source) : undefined;
  const baseUrl = env.BASE_URL?.replace(/\/+$/, '') || undefined;
  if (baseUrl && (!baseUrl.startsWith('/') || baseUrl.startsWith('//') || /[?#]/.test(baseUrl))) {
    throw new Error(`BASE_URL must be a path beginning with "/": ${baseUrl}`);
  }
  // Infer the routing prefix when BASE_URL is unset; an explicit prefix must agree.
  const inferredBaseUrl = siteUrl
    ? new URL(siteUrl).pathname.replace(/\/+$/, '') || undefined
    : undefined;
  if (env.BASE_URL && siteUrl !== undefined && baseUrl !== inferredBaseUrl) {
    throw new Error(`BASE_URL (${baseUrl ?? '/'}) conflicts with the path in ${siteUrl}`);
  }
  return { siteUrl, baseUrl: baseUrl ?? inferredBaseUrl };
}
