import { Author } from '@curvenote/blocks';
import { License } from '../licenses/types';

// Frontmatter and Site/Project Configs
//
// loaded directly from curvenote.yml

export type Frontmatter = {
  title?: string;
  description?: string | null;
  authors?: Author[];
  subject?: string;
  open_access?: boolean;
  license?: string | License | { code?: License; content?: License };
  oxa?: string;
  doi?: string;
  github?: string;
  venue?:
    | string
    | {
        title?: string;
        url?: string;
      };
  // https://docs.openalex.org/about-the-data/work#biblio
  biblio?: {
    volume?: string | number; // sometimes you'll get fun values like "Spring" and "Inside cover."
    issue?: string | number;
    first_page?: string | number;
    last_page?: string | number;
  };
  numbering?:
    | boolean
    | {
        enumerator?: string;
        figure?: boolean;
        equation?: boolean;
        table?: boolean;
        code?: boolean;
        heading_1?: boolean;
        heading_2?: boolean;
        heading_3?: boolean;
        heading_4?: boolean;
        heading_5?: boolean;
        heading_6?: boolean;
      };
  /** Math macros to be passed to KaTeX or LaTeX */
  math?: Record<string, string>;
} & Record<string, any>;
