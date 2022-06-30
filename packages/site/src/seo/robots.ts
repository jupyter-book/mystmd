export function createRobotsTxt(domain: string) {
  return `# https://www.robotstxt.org/robotstxt.html

User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`;
}

export function createRobotsTxtResponse(domain: string) {
  return new Response(createRobotsTxt(domain), {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
