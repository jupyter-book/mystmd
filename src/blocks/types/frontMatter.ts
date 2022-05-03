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

export const DEFAULT_PROJECT_FRONT_MATTER: ProjectFrontMatterProps = {
  authors: [],
  licenses: { content: '' },
  doi: '',
  open_access: false,
  github: '',
  binder: '',
  subtitle: '',
  short_title: '',
};

export const DEFAULT_BLOCK_FRONT_MATTER: BlockFrontMatterProps = {
  ...DEFAULT_PROJECT_FRONT_MATTER,
  venue: { title: '', url: '' },
  biblio: {},
};
