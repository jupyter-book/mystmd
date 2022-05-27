import { MyST } from 'mystjs';
import { reactiveRoles } from './roles';
import { directives } from './directives';

export type Root = ReturnType<typeof MyST.prototype.parse>;

export function parseMyst(content: string): Root {
  const myst = new MyST({
    roles: { ...reactiveRoles },
    directives: { ...directives },
  });
  return myst.parse(content);
}
