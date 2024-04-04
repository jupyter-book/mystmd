import type { ExportFormats } from '../index.js';

export type Download = {
  title?: string;
  format?: ExportFormats;
  id?: string;
  url?: string;
  filename?: string;
  internal?: boolean;
  static?: boolean;
};
