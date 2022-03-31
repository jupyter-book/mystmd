import { formatMinifiedPaths } from '@curvenote/nbtx';
import { GenericNode, selectAll } from 'mystjs';

import { Root } from './types';

export function transformOutputs(mdast: Root) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  outputs.forEach((node) => {
    formatMinifiedPaths(node.data, (p: string) => `/${p}`);
  });
}
