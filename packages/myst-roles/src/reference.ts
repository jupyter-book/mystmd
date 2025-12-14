import type { RoleSpec, RoleData } from 'myst-common';
import { normalizeLabel } from 'myst-common';
import type { CrossReference } from 'myst-spec';

const REF_PATTERN = /^(.+?)<([^<>]+)>$/; // e.g. 'Labeled Reference <ref>'

export const refRole: RoleSpec = {
  name: 'ref',
  alias: ['eq', 'numref', 'prf:ref'],
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData) {
    const body = data.body as string;
    const match = REF_PATTERN.exec(body);
    const [, modified, rawLabel] = match ?? [];
    const { label, identifier } = normalizeLabel(rawLabel ?? body) || {};
    const crossRef: CrossReference = {
      type: 'crossReference',
      kind: data.name as CrossReference['kind'],
      identifier,
      label,
      children: modified ? [{ type: 'text', value: modified.trim() }] : [],
    };
    return [crossRef];
  },
};
