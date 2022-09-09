import type { VFile } from 'vfile';
import type { Link as SpecLink } from 'myst-spec';

export type Link = SpecLink & {
  urlSource?: string;
  internal?: boolean;
  error?: true;
  static?: true;
  protocol?: string;
};

export interface LinkTransformer {
  protocol?: string;
  test: (uri?: string) => boolean;
  transform: (link: Link, file: VFile) => boolean;
}
