type Options = { allow?: string[]; disallow?: string[]; sitemap?: string[] };

export function createRobotsTxt(domain: string, options?: Options) {
  const allow = options?.allow ?? ['/'];
  const disallow = options?.disallow ?? [];
  const sitemap = options?.sitemap ?? ['/sitemap.xml'];
  const rules = [
    ...allow.map((path) => `Allow: ${path}`),
    ...disallow.map((path) => `Disallow: ${path}`),
    ...sitemap.map((path) => `Sitemap: ${domain}${path}`),
  ];
  return `# https://www.robotstxt.org/robotstxt.html

User-agent: *
${rules.join('\n')}
`;
}

export function createRobotsTxtResponse(domain: string, options?: Options) {
  return new Response(createRobotsTxt(domain, options), {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
