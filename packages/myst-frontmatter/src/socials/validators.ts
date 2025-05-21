import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateObjectKeys,
  validateString,
  validateUrl,
  validationError,
  validateDomain,
} from 'simple-validators';
import { SOCIAL_LINKS_KEYS, SOCIAL_LINKS_ALIASES } from './types.js';
import type { SocialLinks } from './types.js';

// Match basic identifier (letters, numbers, underscores) plus a permissive domain (ANYTHING DOT ANYTHING NOT-A-DOT)
const MASTODON_REGEX = /^@([A-Z0-9_]+)@(.+\..*[^.])$/i;
// Match a permissive domain (ANYTHING DOT ANYTHING NOT-A-DOT)
const BLUESKY_REGEX = /^@(.+\..*[^.])$/;
const BLUESKY_URL_REGEX = /^https:\/\/bsky.app\/profile\/(.*)$/;

/**
 * Validate value is valid Mastodon webfinger account
 *
 * See https://docs.joinmastodon.org/spec/webfinger/ for details on how
 * @foo@server.com account URIs are resolved
 */
export function validateMastodon(input: any, opts: ValidationOptions) {
  const value = validateString(input, opts);
  if (value === undefined) return undefined;

  const match = value.match(MASTODON_REGEX);
  if (match === null)
    return validationError(
      `must be a user ID of the form @username@server e.g. @mystmarkdown@fosstodon.org`,
      opts,
    );

  const username = match[1];
  const host = validateDomain(match[2], opts);
  if (host === undefined) return undefined;

  return `@${username}@${host}`;
}

/**
 * Validate value is valid Bluesky URI or URL string
 */
export function validateBluesky(input: any, opts: ValidationOptions) {
  const value = validateString(input, opts);
  if (value === undefined) return undefined;

  // Username
  let match: ReturnType<typeof value.match>;
  if ((match = value.match(BLUESKY_REGEX))) {
    const domain = validateDomain(match[1], opts);
    return `@${domain}`;
  }
  // URL to profile
  else {
    const result = validateUrl(value, opts);
    if (result === undefined) return undefined;

    match = result.match(BLUESKY_URL_REGEX);
    if (match === null) {
      return validationError(
        `Bluesky profile URL must be a valid URL starting with https://bsky.app/profile/: ${value}`,
        opts,
      );
    }

    const domain = validateDomain(match[1], opts);
    if (domain === undefined) return undefined;

    return `@${domain}`;
  }
}

export function validateSocialLinks(
  input: any,
  opts: ValidationOptions,
  output?: SocialLinks,
): SocialLinks | undefined {
  const value: SocialLinks = output
    ? input
    : validateObjectKeys(
        input,
        { optional: SOCIAL_LINKS_KEYS as unknown as string[], alias: SOCIAL_LINKS_ALIASES },
        opts,
      );

  if (value === undefined) return undefined;

  const result = output ?? {};

  // FIXME: normalize usernames into URLs
  if (defined(value.url)) {
    result.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  if (defined(value.github)) {
    result.github = validateString(value.github, incrementOptions('github', opts));
  }
  if (defined(value.bluesky)) {
    result.bluesky = validateBluesky(value.bluesky, incrementOptions('bluesky', opts));
  }
  if (defined(value.mastodon)) {
    result.mastodon = validateMastodon(value.mastodon, incrementOptions('mastodon', opts));
  }
  if (defined(value.linkedin)) {
    result.linkedin = validateUrl(value.linkedin, incrementOptions('linkedin', opts));
  }
  if (defined(value.threads)) {
    result.threads = validateString(value.threads, incrementOptions('threads', opts));
  }
  if (defined(value.twitter)) {
    result.twitter = validateString(value.twitter, incrementOptions('twitter', opts));
  }
  if (defined(value.youtube)) {
    result.youtube = validateUrl(value.youtube, incrementOptions('youtube', opts));
  }
  if (defined(value.discourse)) {
    result.discourse = validateUrl(value.discourse, incrementOptions('discourse', opts));
  }
  if (defined(value.discord)) {
    result.discord = validateUrl(value.discord, incrementOptions('discord', opts));
  }
  if (defined(value.slack)) {
    result.slack = validateUrl(value.slack, incrementOptions('slack', opts));
  }
  if (defined(value.facebook)) {
    result.facebook = validateUrl(value.facebook, incrementOptions('facebook', opts));
  }
  return result;
}
