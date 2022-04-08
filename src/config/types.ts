import { ExportableFormatTypes } from '@curvenote/blocks';

export interface WebConfig {
  name: string;
  sections: { title: string; folder: string }[];
  actions: { title: string; url: string }[];
  favicon?: string;
  logo?: string;
  logoText?: string;
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

export interface CurvenoteConfig {
  version: number;
  sync: Record<string, any>;
  web: WebConfig;
  export: ExportConfig[];
}
