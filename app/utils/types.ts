import { GenericNode, GenericParent } from 'mystjs';

export type Heading = {
  slug?: string;
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
