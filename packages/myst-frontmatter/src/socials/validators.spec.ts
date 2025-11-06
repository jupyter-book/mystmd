import { describe, test, expect } from 'vitest';
import type { ValidationOptions } from 'simple-validators';
import {
  validateMastodon,
  validateBluesky,
  validateTelegram,
  validateTwitter,
  validateYouTube,
  validateGitHub,
} from './validators.js';

const it = test.extend<{ opts: ValidationOptions }>({
  // use a fixture here in case `opts` is modified in a test
  opts: async ({ task }, use) => {
    await use({ property: '', messages: {} });
  },
});

describe('validateMastodon', () => {
  it('should validate a valid Mastodon username', ({ opts }) => {
    const result = validateMastodon('@user@server.com', opts);
    expect(result).toBe('@user@server.com');
  });

  it('should validate a valid Mastodon username without the initial @', ({ opts }) => {
    const result = validateMastodon('user@server.com', opts);
    expect(result).toBe('@user@server.com');
  });

  it('should throw a ValidationError for a Mastodon username without a domain', ({ opts }) => {
    const result = validateMastodon('@user', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(
      `must be a user ID of the form @username@server e.g. @mystmarkdown@fosstodon.org`,
    );
  });
});

describe('validateTelegram', () => {
  it('should validate a valid Telegram username with @', ({ opts }) => {
    const result = validateTelegram('@i_am_POPULAR95', opts);
    expect(result).toBe('i_am_POPULAR95');
  });

  it('should validate a valid Telegram username', ({ opts }) => {
    const result = validateTelegram('i_am_POPULAR95', opts);
    expect(result).toBe('i_am_POPULAR95');
  });

  it('should validate a valid t.me profile URL', ({ opts }) => {
    const result = validateTelegram('https://t.me/i_am_popular95', opts);
    expect(result).toBe('i_am_popular95');
  });

  it('should validate a valid telegram.me profile URL', ({ opts }) => {
    const result = validateTelegram('https://telegram.me/i_am_popular95', opts);
    expect(result).toBe('i_am_popular95');
  });

  it('should return an error for invalid Telegram usernames', ({ opts }) => {
    const result = validateTelegram('invalid username', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(
      'Telegram social identity must be a valid URL',
    );
  });

  it('should return an error for non-telegram URL', ({ opts }) => {
    const result = validateTelegram('https://example.com', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(
      `Telegram social identity must be a valid URL starting with either `,
    );
  });
});

describe('validateBluesky', () => {
  it('should validate a valid bluesky domain', ({ opts }) => {
    const result = validateBluesky('@user.bsky.social', opts);
    expect(result).toBe('@user.bsky.social');
  });

  it('should validate a valid bluesky domain without the @', ({ opts }) => {
    const result = validateBluesky('@user.bsky.social', opts);
    expect(result).toBe('@user.bsky.social');
  });

  it('should validate a valid bluesky profile URL', ({ opts }) => {
    const result = validateBluesky('https://bsky.app/profile/@user.bsky.social', opts);
    expect(result).toBe('@user.bsky.social');
  });

  it('should validate a valid bluesky profile URL without the @', ({ opts }) => {
    const result = validateBluesky('https://bsky.app/profile/user.bsky.social', opts);
    expect(result).toBe('@user.bsky.social');
  });

  it('should return an error for invalid bluesky input', ({ opts }) => {
    const result = validateBluesky('invalid username', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(`must be valid URL`);
  });

  it('should return an error for non-bluesky URL', ({ opts }) => {
    const result = validateBluesky('https://example.com', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(
      `Bluesky profile URL must be a valid URL starting with https://bsky.app/profile/`,
    );
  });
});

describe('validateTwitter', () => {
  it('should validate a valid Twitter username', ({ opts }) => {
    const result = validateTwitter('@username', opts);
    expect(result).toBe('username');
  });

  it('should validate a valid Twitter username without the @', ({ opts }) => {
    const result = validateTwitter('username', opts);
    expect(result).toBe('username');
  });

  it('should validate a valid Twitter URL', ({ opts }) => {
    const result = validateTwitter('https://twitter.com/@username', opts);
    expect(result).toBe('username');
  });

  it('should validate a valid Twitter URL without the @', ({ opts }) => {
    const result = validateTwitter('https://twitter.com/username', opts);
    expect(result).toBe('username');
  });

  it('should validate a valid X Formerly Known As Twitter URL', ({ opts }) => {
    const result = validateTwitter('https://x.com/@username', opts);
    expect(result).toBe('username');
  });

  it('should validate a valid X Formerly Known As Twitter URL without the @', ({ opts }) => {
    const result = validateTwitter('https://x.com/username', opts);
    expect(result).toBe('username');
  });

  it('should return an error for a Twitter username with invalid characters', ({ opts }) => {
    const result = validateTwitter('@kljj#rer', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(
      `Twitter social identity must be a valid URL starting with https://twitter.com/, https://x.com/, or a valid username`,
    );
  });

  it('should return an error for a Twitter username with too few characters', ({ opts }) => {
    const result = validateTwitter('@kj', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(
      `Twitter social identity must be a valid URL starting with https://twitter.com/, https://x.com/, or a valid username`,
    );
  });

  it('should return an error for a Twitter username with too many characters', ({ opts }) => {
    const result = validateTwitter('@goshilovetacosgoshilovetacosgoshilovetacos', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(
      `Twitter social identity must be a valid URL starting with https://twitter.com/, https://x.com/, or a valid username`,
    );
  });

  it('should return an error for a a non-Twitter/X URL', ({ opts }) => {
    const result = validateTwitter('https://example.com', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(
      `Twitter social identity must be a valid URL starting with https://twitter.com/, https://x.com/, or a valid username`,
    );
  });
});

describe('validateYouTube', () => {
  it('should validate a valid YouTube handle', ({ opts }) => {
    const result = validateYouTube('@handle', opts);
    expect(result).toBe('handle');
  });

  it('should validate a valid YouTube handle without the @', ({ opts }) => {
    const result = validateYouTube('handle', opts);
    expect(result).toBe('handle');
  });

  it('should validate a valid YouTube URL', ({ opts }) => {
    const result = validateYouTube('https://youtube.com/channel/UC123', opts);
    expect(result).toBe('https://youtube.com/channel/UC123');
  });

  it('should return an error for an invalid YouTube handle', ({ opts }) => {
    const result = validateYouTube('@as#df', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(
      `YouTube social identity must be a valid URL starting with https://youtube.com/ or a valid handle`,
    );
  });

  it('should return an error for a non-YouTube URL', ({ opts }) => {
    const result = validateYouTube('https://example.com', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(`youtube.com`);
  });
});

describe('validateGitHub', () => {
  it('should validate a valid GitHub username', ({ opts }) => {
    const result = validateGitHub('@username', opts);
    expect(result).toBe('username');
  });

  it('should validate a valid GitHub username without the @', ({ opts }) => {
    const result = validateGitHub('username', opts);
    expect(result).toBe('username');
  });

  it('should validate a valid GitHub repo', ({ opts }) => {
    const result = validateGitHub('org/repo', opts);
    expect(result).toBe('org/repo');
  });

  it('should validate a valid GitHub org URL', ({ opts }) => {
    const result = validateGitHub('https://github.com/orgs/org', opts);
    expect(result).toBe('https://github.com/orgs/org');
  });

  it('should return an error for an invalid GitHub username', ({ opts }) => {
    const result = validateGitHub('@asdfg#', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(
      `GitHub social identity must be a valid username, org/repo, or org URL`,
    );
  });

  it('should return an error for a non-org GitHub URL', ({ opts }) => {
    const result = validateGitHub('https://github.com/user', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(
      `GitHub social identity must be a valid username, org/repo, or org URL`,
    );
  });

  it('should return an error for a non-GitHub URL', ({ opts }) => {
    const result = validateGitHub('https:/example.com', opts);
    expect(result).toBeUndefined();
    expect(opts.messages.errors?.at(0)?.message).toContain(
      `GitHub social identity must be a valid username, org/repo, or org URL`,
    );
  });
});
