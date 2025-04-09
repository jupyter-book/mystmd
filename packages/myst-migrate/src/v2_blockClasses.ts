import { selectAll } from 'unist-util-select';
import { assert } from 'console';
import type { IFile } from './types.js';

export const VERSION = 2;
export const DATE = new Date(Date.parse('2025-03-05'));

export const DESCRIPTION = `
Blocks could previously define class on \`block.data?.class\`, this has been explicitly moved to \`block.class\`.
`;

type Block = {
  type: 'block';
  class?: string;
  data?: {
    /** @deprecated this is moved to node.class */
    class: string | any;
  };
};

export function upgrade(file: IFile): IFile {
  const { version, mdast } = file;
  assert(version === VERSION, `Version must be ${VERSION}`);
  const nodes = selectAll('block', mdast) as Block[];
  nodes.forEach((node) => {
    if (typeof node.data?.class === 'string') {
      node.class = `${node.class ?? ''} ${node.data.class}`.trim();
      delete node.data.class;
      if (Object.keys(node.data).length === 0) delete node.data;
    }
  });
  return file;
}

export function downgrade(file: IFile): IFile {
  // Nothing to do, as both were compatible before.
  return file;
}
