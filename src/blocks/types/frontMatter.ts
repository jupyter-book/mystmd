import { Author } from './author';

// All frontmatter props are optional in order to save storage and transfer payload size
// When the values are null indicates it has been explicitly set to null.

export type FrontMatterProps = {
  authors: Author[] | null;
  licenses: { content: string | null; code: string | null } | null;
  doi: string | null;
  arxiv: string | null;
  open_access: boolean | null;
  github: string | null;
  binder: string | null;
  subject: string | null;
  subtitle: string | null;
  short_title: string | null;
  venue: { title?: string; url?: string } | null;
  biblio: {
    volume?: string;
    issue?: string;
    first_page?: string;
    last_page?: string;
  } | null;
};

export type BlockFrontMatterProps = Partial<FrontMatterProps>;

export type ProjectFrontMatterProps = Omit<BlockFrontMatterProps, 'venue' | 'biblio' | 'subtitle'>;

// Exhausiveness is ensured in test
export const PROJECT_FRONT_MATTER_KEYS = [
  'authors',
  'licenses',
  'doi',
  'arxiv',
  'open_access',
  'github',
  'binder',
  'subject',
  'short_title',
] as (keyof ProjectFrontMatterProps)[];

export const BLOCK_FRONT_MATTER_KEYS = [
  ...PROJECT_FRONT_MATTER_KEYS,
  'venue',
  'biblio',
  'subtitle',
] as (keyof BlockFrontMatterProps)[];
