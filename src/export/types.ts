import { ExportableFormatTypes } from '@curvenote/blocks';

export interface ExportConfig {
  name: string;
  kind: ExportableFormatTypes;
  project: string;
  folder: string;
  contents: { name?: string; link?: string; version?: number }[];
  data: {
    authors: {
      name: string;
      username?: string;
      corresponding: boolean;
      email: string;
    }[];
  };
}

export interface Config {
  version: number;
  sync: Record<string, any>;
  export: ExportConfig[];
}
