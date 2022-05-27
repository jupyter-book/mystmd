import { GenericNode, selectAll } from 'mystjs';
import { walkPaths } from '@curvenote/nbtx';
import { Root } from '../myst';

export function transformOutputs(mdast: Root) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  outputs.forEach((node) => {
    walkPaths(node.data, (p: string, obj: any) => {
      obj.path = `/${p}`;
      obj.content = `/${obj.content}`;
    });
  });
}
