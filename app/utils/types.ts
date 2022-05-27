import { Author } from '@curvenote/blocks';
import type { GenericNode, GenericParent } from 'mystjs';

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
  article?: GenericParent;
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

export type pageLevels = 1 | 2 | 3 | 4 | 5 | 6;

export type SiteNavPage = {
  title: string;
  url: string;
};

export type SiteNavFolder = {
  title: string;
  url?: string;
  children: SiteNavPage[];
};

export type SiteNavItem = SiteNavPage | SiteNavFolder;

export type SiteAction = SiteNavPage & {
  static: boolean;
};

export type ManifestProjectFolder = {
  title: string;
  level: pageLevels;
};

export type ManifestProjectPage = {
  slug: string;
} & ManifestProjectFolder;

export type ManifestProject = {
  slug: string;
  index: string;
  title: string;
  pages: (ManifestProjectPage | ManifestProjectFolder)[];
} & Frontmatter;

export type SiteManifest = {
  title: string;
  twitter?: string;
  logo?: string;
  logoText?: string;
  nav: SiteNavItem[];
  actions: SiteAction[];
  projects: ManifestProject[];
};
