import type { ExportFormats } from '../exports/types.js';

export type Download = {
  title?: string;
  format?: ExportFormats;
  id?: string;
  url?: string;
  filename?: string;
  static?: boolean;
};
