export const SOCIAL_LINKS_KEYS = [
  'url',
  'github',
  'bluesky',
  'mastodon',
  'linkedin',
  'threads',
  'twitter', // Change to 'x' in future
  'youtube',
  'discourse',
  'discord',
  'slack',
  'facebook',
] as const;

export const SOCIAL_LINKS_ALIASES = {
  website: 'url',
  x: 'twitter', // Can change this in a future release to be the other way
  bsky: 'bluesky',
  instagram: 'threads', // This is the same username
};

export type SocialLinks = {
  [key in (typeof SOCIAL_LINKS_KEYS)[number]]?: string;
};
