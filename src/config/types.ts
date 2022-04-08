import { ExportableFormatTypes } from '@curvenote/blocks';

export interface WebConfig {
  name: string;
  sections: { title: string; folder: string; path: string }[];
  actions: { title: string; url: string; static?: boolean }[];
  favicon?: string | null;
  logo?: string | null;
  logoText?: string | null;
  design?: {
    hideAuthors?: boolean;
  };
  /** Domain hostname, for example, docs.curve.space or docs.curvenote.com */
  domains?: string[];
  /** Twitter handle for the site (not the article) */
  twitter?: string | null;
}

export interface ExportConfig {
  name: string;
  kind: ExportableFormatTypes;
  project: string;
  folder: string;
  filename?: string;
  template?: string;
  templatePath?: string;
  contents: { name?: string; link?: string; version?: number }[];
  data: {
    title?: string;
    short_title?: string;
    description?: string;
    date?: string;
    authors: {
      name?: string;
      id?: string;
      corresponding?: boolean;
      email?: string;
    }[];
  } & Record<string, any>;
}

export interface SyncConfig {
  id: string; // ProjectId
  folder: string; // Local folder
  link: string; // Project Link
}

export const CONFIG_VERSION = 1;

export interface CurvenoteConfig {
  version: number;
  sync: SyncConfig[];
  web: WebConfig;
  export?: ExportConfig[];
}
