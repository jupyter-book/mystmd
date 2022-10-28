import { MyST } from 'mystjs';
import type { Root } from 'mdast';
import { reactiveRoles } from './roles';
import { directives } from './directives';

export function parseMyst(content: string): Root {
  const myst = new MyST({
    roles: { ...reactiveRoles },
    directives: { ...directives },
    markdownit: { linkify: true },
  });
  return myst.parse(content);
}
