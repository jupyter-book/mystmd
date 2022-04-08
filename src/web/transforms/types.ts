import { GenericNode, MyST } from 'mystjs';

export type Root = ReturnType<typeof MyST.prototype.parse>;

export type Citations = {
  order: string[];
  data: Record<string, { html: string; number: number; doi: string | undefined }>;
};

export type Footnotes = Record<string, GenericNode>;

export type References = {
  cite: Citations;
  footnotes: Footnotes;
};
