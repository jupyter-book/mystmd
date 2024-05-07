import type { VFile } from 'vfile';
import type { Link as SpecLink } from 'myst-spec';
import type { ExternalReference } from 'myst-frontmatter';
import type { Inventory } from 'intersphinx';

export type Link = SpecLink & {
  urlSource?: string;
  internal?: boolean;
  error?: true;
  static?: true;
  protocol?: string;
  dataUrl?: string;
};

export interface LinkTransformer {
  protocol?: string;
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
