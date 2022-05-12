import { Author } from './author';

// All frontmatter props are optional in order to save storage and transfer payload size
// When the values are null indicates it has been explicitly set to null.
export interface BlockFrontMatterProps {
  authors?: Author[] | null;
  licenses?: { content: string | null; code: string | null };
  doi?: string | null;
  open_access?: boolean | null;
  github?: string | null;
  binder?: string | null;
  subtitle?: string | null;
  short_title?: string | null;
  venue?: { title?: string; url?: string } | null;
  biblio?: {
    volume?: string;
    issue?: string;
    first_page?: string;
    last_page?: string;
  } | null;
}

export type ProjectFrontMatterProps = Omit<BlockFrontMatterProps, 'venue' | 'biblio'>;

// TODO: ensure exhausiveness
export const PROJECT_FRONT_MATTER_KEYS = [
  'authors',
  'licenses',
  'doi',
  'open_access',
  'github',
  'binder',
  'subtitle',
  'short_title',
] as (keyof ProjectFrontMatterProps)[];

export const BLOCK_FRONT_MATTER_KEYS = [
  ...PROJECT_FRONT_MATTER_KEYS,
  'venue',
  'biblio',
] as (keyof BlockFrontMatterProps)[];
