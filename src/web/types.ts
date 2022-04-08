import { WebConfig } from '../config/types';
import { ISession } from '../session/types';

export interface IDocumentCache {
  session: ISession;

  options: Options;

  config: SiteConfig | null;

  readConfig(): Promise<void>;

  writeConfig(): Promise<void>;
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
