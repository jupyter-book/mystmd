export function parseGitUrl(maybeUrl: string) {
  const provider_domain = maybeUrl.includes('github.com') ? 'github.com' : 'gitlab.com';
  const provider = provider_domain.split('.')[0];
  if (maybeUrl.startsWith(`git@${provider_domain}`)) {
    const [, owner, repo] =
      maybeUrl.match(new RegExp(`git@${provider_domain}:([^/]+)/([^/]+)/?.*$`)) || [];
    return {
      url: maybeUrl.replace(`git@${provider_domain}:`, `https://${provider_domain}/`),
      owner,
      repo: repo.replace('.git', ''),
      provider,
    };
  }
  const url = maybeUrl.startsWith(provider_domain) ? `https://${maybeUrl}` : maybeUrl;
  if (
    url.startsWith(`http://${provider_domain}/`) ||
    url.startsWith(`https://${provider_domain}/`)
  ) {
    const [, owner, repo] =
      url.match(new RegExp(`http[s]*://${provider_domain}/([^/]+)/([^/#]+)/?.*$`)) || [];
    return {
      url: `https://${provider_domain}/${owner}/${repo}${url.endsWith('.git') ? '' : '.git'}`,
      owner,
      repo: repo.replace('.git', ''),
      provider,
    };
  }

  throw Error(`Unsupported url: ${url}`);
}
