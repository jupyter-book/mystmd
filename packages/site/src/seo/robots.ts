export function createRobotsTxt(domain: string) {
  return `# https://www.robotstxt.org/robotstxt.html

User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`;
}
