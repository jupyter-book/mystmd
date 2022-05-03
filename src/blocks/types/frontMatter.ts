import { Author } from './author';

export interface BlockFrontMatterProps {
  authors?: Author[];
  licenses?: { content: string; code?: string };
  doi?: string;
  open_access?: boolean;
  github?: string;
  binder?: string;
  subtitle?: string;
  short_title?: string;
  venue?: { title?: string; url?: string };
  biblio?: {
    volume?: string;
    issue?: string;
    first_page?: string;
    last_page?: string;
  };
}

export type ProjectFrontMatterProps = Omit<BlockFrontMatterProps, 'venue' | 'biblio'>;

// TODO: ensure exausiveness
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
