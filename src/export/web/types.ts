import { WebConfig } from '../../config/types';

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
  branch?: boolean;
};
