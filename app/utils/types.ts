import { Author } from '@curvenote/blocks';
import type { GenericNode, GenericParent } from 'mystjs';

export type NavItem = {
  title: string;
  url: string;
  children: Omit<NavItem, 'children'>[]; // Only one deep
};

export type Config = {
  id: string;
  site: {
    name: string;
    sections: { title: string; folder: string }[];
    twitter?: string;
    actions: { title: string; url: string; static?: boolean }[];
    nav: NavItem[];
    logo?: string;
    logoText?: string;
  };
  folders: Record<
    string,
    {
      title: string;
      index: string;
      pages: { title: string; slug?: string; level: number }[];
    }
  >;
};

export type Heading = {
  slug?: string;
  path?: string;
  title: string;
  level: number | 'index';
  group?: string;
};

export type Citations = {
  order: string[];
  data: Record<string, { html: string; number: number }>;
};

export type Footnotes = Record<string, GenericNode>;

export type References = {
  cite: Citations;
  footnotes: Footnotes;
};

export type NavigationLink = {
  group?: string;
  title: string;
  url: string;
};

export type FooterLinks = {
  navigation?: {
    prev?: NavigationLink;
    next?: NavigationLink;
  };
};

enum CreativeCommonsLicense {
  'CC0' = 'CC0-1.0',
  'CC-BY' = 'CC-BY-4.0',
  'CC-BY-SA' = 'CC-BY-SA-4.0',
  'CC-BY-NC' = 'CC-BY-NC-4.0',
  'CC-BY-NC-SA' = 'CC-BY-NC-SA-4.0',
  'CC-BY-ND' = 'CC-BY-ND-4.0',
  'CC-BY-NC-ND' = 'CC-BY-NC-ND-4.0',
}

export type Frontmatter = {
  title?: string;
  description?: string;
  authors?: Author[];
  subject?: string;
  open_access?: boolean;
  license?: CreativeCommonsLicense;
  doi?: string;
  github?: string;
  journal?: string | { title?: string; url?: string; volume?: number; issue?: number };
  numbering?:
    | boolean
    | {
        enumerator?: string;
        figure?: boolean;
        equation?: boolean;
        heading_1?: boolean;
        heading_2?: boolean;
        heading_3?: boolean;
        heading_4?: boolean;
        heading_5?: boolean;
        heading_6?: boolean;
      };
} & Record<string, string | boolean>;

export type PageLoader = {
  frontmatter: Frontmatter;
  mdast: GenericParent;
  references: References;
  footer?: FooterLinks;
};
