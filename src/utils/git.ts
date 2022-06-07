export function parseSourceUrl(source_url: string) {
  const provider_domain = source_url.includes('github.com') ? 'github.com' : 'gitlab.com';
  const provider = provider_domain.split('.')[0];
  if (source_url.startsWith(`https://${provider_domain}/`)) {
    const [, owner, repo] =
      source_url.match(new RegExp(`https://${provider_domain}/([^/]+)/([^/]+)/?.*$`)) || [];
    return {
      url: source_url.endsWith('.git')
        ? source_url
        : `https://${provider_domain}/${owner}/${repo}.git`,
      owner,
      repo: repo.replace('.git', ''),
      provider,
    };
  }
  if (source_url.startsWith(`git@${provider_domain}`)) {
    const [, owner, repo] =
      source_url.match(new RegExp(`git@${provider_domain}:([^/]+)/([^/]+)/?.*$`)) || [];
    return {
      url: source_url.replace(`git@${provider_domain}:`, `https://${provider_domain}/`),
      owner,
      repo: repo.replace('.git', ''),
      provider,
    };
  }
  throw Error(`Unsupported source_url: ${source_url}`);
}
