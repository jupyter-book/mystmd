import { selectAll } from 'unist-util-select';
import { assert } from 'console';
import { validateSocialLinks } from 'myst-frontmatter';
import type { IFile } from './types.js';

export const description = `
The canonical representation for various social links has been made stricter, 
e.g. Twitter '@username' → 'username'
`;

// Match a basic identifier (letters, numbers, underscores, between 4 and 15 characters)
const TWITTER_REGEX = /^@?([A-Z0-9_]{4,15})$/i;
const TWITTER_URL_REGEX = /^https:\/\/(twitter\.com|x\.com)\/@?([A-Z0-9_]{4,15})$/;

function upgradeSocials(object: Record<string, any> | undefined) {
  if (object === undefined) return;
  const value = object['twitter'] as string | undefined;
  if (value === undefined) return;

  let match: ReturnType<typeof value.match>;
  // URL
  if ((match = value.match(TWITTER_URL_REGEX))) {
    object.twitter = match[1];
    return;
  }
  // username
  else if ((match = value.match(TWITTER_REGEX))) {
    object.twitter = match[1];
    return;
  } else {
    throw new Error(
      `Twitter social identity must be a valid URL starting with https://twitter.com/, https://x.com/, or a valid username: ${value}`,
    );
  }
}

function downgradeSocials(object: Record<string, any> | undefined) {
  if (object === undefined) return;
  if (object.twitter !== undefined) {
    object.twitter = `@${object.twitter}`;
  }
}
function transformFrontmatter(
  frontmatter: IFile['frontmatter'],
  transform: (obj: Record<string, any> | undefined) => void,
) {
  frontmatter.authors ??= transform(frontmatter.authors);
  frontmatter.constributors ??= transform(frontmatter.constributors);
  frontmatter.reviewers ??= transform(frontmatter.reviewers);
  frontmatter.editors ??= transform(frontmatter.editors);

  if (frontmatter.funding !== undefined) {
    const funding = frontmatter.funding;

    funding.authors ??= transform(funding.recipients);
    funding.investigators ??= transform(funding.investigators);

    if (funding.awards !== undefined) {
      const awards = funding.awards;

      awards.authors ??= transform(awards.recipients);
      awards.investigators ??= transform(awards.investigators);
    }
  }
}
export function upgrade(file: IFile): IFile {
  const { version, frontmatter } = file;

  // The first version can allow version to be null
  assert(version === 2, 'Version must be 2');
  transformFrontmatter(frontmatter, upgradeSocials);
  return file;
}

export function downgrade(file: IFile): IFile {
  const { version, frontmatter } = file;
  assert(version === 3, 'Version must be 3');

  transformFrontmatter(frontmatter, downgradeSocials);
  if (frontmatter.socials !== undefined) {
    delete frontmatter.socials;
  }

  return file;
}
