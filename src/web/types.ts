import { Author } from '@curvenote/blocks';
import { CitationRenderer } from 'citation-js-utils';
import { WebConfig } from '../config/types';
import { ISession } from '../session/types';

export interface IDocumentCache {
  session: ISession;

  options: Options;

  config: SiteConfig | null;

  readConfig(): Promise<void>;

  writeConfig(): Promise<void>;
}

export enum CreativeCommonsLicense {
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
} & Record<string, any>;

export type FolderConfig = Frontmatter;

export interface FolderContext {
  folder: string;
  config: FolderConfig;
  citeRenderer: CitationRenderer;
}

export interface Page {
  title: string;
  slug?: string;
  level: number;
}

export type SiteFolder = {
  title: string;
  index: string;
  pages: Page[];
};

export interface SiteConfig {
  site: WebConfig;
  folders: Record<string, SiteFolder>;
}

export type Options = {
  buildPath?: string;
  clean?: boolean;
  force?: boolean;
  branch?: string;
};
