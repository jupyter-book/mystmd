export function parseGitUrl(url: string) {
  const provider_domain = url.includes('github.com') ? 'github.com' : 'gitlab.com';
  const provider = provider_domain.split('.')[0];
  if (url.startsWith(`https://${provider_domain}/`)) {
    const [, owner, repo] =
      url.match(new RegExp(`https://${provider_domain}/([^/]+)/([^/]+)/?.*$`)) || [];
    return {
      url: url.endsWith('.git') ? url : `https://${provider_domain}/${owner}/${repo}.git`,
      owner,
      repo: repo.replace('.git', ''),
      provider,
    };
  }
  if (url.startsWith(`git@${provider_domain}`)) {
    const [, owner, repo] =
      url.match(new RegExp(`git@${provider_domain}:([^/]+)/([^/]+)/?.*$`)) || [];
    return {
      url: url.replace(`git@${provider_domain}:`, `https://${provider_domain}/`),
      owner,
      repo: repo.replace('.git', ''),
      provider,
    };
  }
  throw Error(`Unsupported source_url: ${url}`);
}
