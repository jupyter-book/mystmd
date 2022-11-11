import { fileWarn } from 'myst-common';
import type { VFile } from 'vfile';
import type { Link, LinkTransformer } from './types';
import { updateLinkTextIfEmpty, withoutHttp } from './utils';

const RESOLVER = 'https://github.com/';
const TRANSFORM_SOURCE = 'LinkTransform:Github';

type GithubFileLink = {
  kind: 'file';
  org: string;
  repo: string;
  /**
   * This can be a branch name, a tag, or a hash.
   */
  reference: string;
  file: string;
  from?: number;
  to?: number;
};

/**
 * This takes a url like:
 *
 *    https://github.com/executablebooks/mystjs/blob/3cdb8ec6/packages/mystjs/src/mdast/state.ts#L32-L36
 *
 * And creates the raw url information to create a github raw url, like:
 *
 *    https://raw.githubusercontent.com/executablebooks/mystjs/3cdb8ec6/packages/mystjs/src/mdast/state.ts
 */
function parseGithubFile(urlSource: string): undefined | GithubFileLink {
  const url = new URL(urlSource);
  if (url.host !== 'github.com') return;
  const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/);
  if (!match) return;
  const [, org, repo, reference, file] = match;
  const lineNumbers = url.hash.match(/L([0-9]+)(?:-L([0-9]+))?/);
  const [, fromString, toString] = lineNumbers ?? [];
  const from = fromString ? Number(fromString) : undefined;
  const to = toString ? Number(toString) : undefined;
  return {
    kind: 'file',
    org,
    repo,
    reference,
    file,
    from,
    to,
  };
}

function rawUrl(github: GithubFileLink) {
  return `https://raw.githubusercontent.com/${github.org}/${github.repo}/${github.reference}/${github.file}`;
}

export class GithubTransformer implements LinkTransformer {
  protocol = 'github';

  test(uri?: string): boolean {
    if (!uri) return false;
    return withoutHttp(uri).startsWith(withoutHttp(RESOLVER));
  }

  transform(link: Link, file: VFile): boolean {
    const urlSource = link.urlSource || link.url;
    const github = parseGithubFile(urlSource);
    if (!github) {
      // fileWarn(file, `Found Github url, but couldn't parse it: ${urlSource}`, {
      //   node: link,
      //   source: TRANSFORM_SOURCE,
      // });
      return false;
    }
    link.data = {
      ...github,
      raw: rawUrl(github),
    };
    link.internal = false;
    updateLinkTextIfEmpty(link, github.file);
    return true;
  }
}
