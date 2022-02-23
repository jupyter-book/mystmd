import { ExportableFormatTypes } from '@curvenote/blocks';

export interface ExportConfig {
  name: string;
  kind: ExportableFormatTypes;
  project: string;
  folder: string;
  template: string;
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
  };
}

export interface Config {
  version: number;
  sync: Record<string, any>;
  export: ExportConfig[];
}
