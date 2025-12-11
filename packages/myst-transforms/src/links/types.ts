import type { VFile } from 'vfile';
import type { ExternalReference } from 'myst-frontmatter';
import type { Link } from 'myst-spec-ext';
import type { Inventory } from 'intersphinx';

export interface LinkTransformer {
  protocol?: string;
  formatsText?: boolean;
  test: (uri?: string) => boolean;
  transform: (link: Link, file: VFile) => boolean;
}

export type ResolvedExternalReference = ExternalReference & {
  key: string;
  value?: Inventory | MystXRefs;
};

export type MystXRef = {
  identifier?: string;
  html_id?: string;
  kind: string;
  data: string;
  url: string;
  implicit?: boolean;
};

export type MystXRefs = {
  version: '1';
  myst: string;
  references: MystXRef[];
};
