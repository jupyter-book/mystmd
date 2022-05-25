import { CitationRenderer } from 'citation-js-utils';
import { Frontmatter, WebConfig } from '../types';
import { ISession } from '../session/types';

export interface IDocumentCache {
  session: ISession;

  options: Options;

  config: SiteConfig | null;
}

export type FolderConfig = Frontmatter;

export interface FolderContext {
  folder: string;
  path: string;
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
  ci?: boolean;
  yes?: boolean;
};
