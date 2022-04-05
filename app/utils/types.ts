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

export type Frontmatter = {
  title?: string;
  author?: string[];
  description?: string;
};

export type PageLoader = {
  frontmatter: Frontmatter;
  mdast: GenericParent;
  references: References;
  footer?: FooterLinks;
};
