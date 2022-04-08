import { GenericNode, selectAll } from 'mystjs';

import { Root } from './types';

export function transformOutputs(mdast: Root) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  outputs.forEach((output) => {
    Object.values(output.data.items as { path?: string }[]).forEach((item) => {
      if (item.path) item.path = `/${item.path}`;
    });
  });
}
