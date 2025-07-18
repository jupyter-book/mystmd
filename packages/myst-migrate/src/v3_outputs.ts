import { selectAll } from 'unist-util-select';
import type { IFile } from './types.js';

export const VERSION = 3;
export const DATE = new Date(Date.parse('2025-04-09'));

export const DESCRIPTION = `
\`Output\` nodes previously could not represent AST trees for each output. 
Now, the \`Outputs\` node has \`Output\` children with a 1:1 correspondence to \`IOutput\` bundles.

Existing identifiers for the \`Output\` / \`Outputs\` nodes are not modified, as these are considered "content".
`;

type OutputV2 = {
  type: 'output';
  children?: any[];

  data?: any[];
  visibility?: any;

  html_id?: string;
  label?: string;
  identifier?: string;

  id?: string;
};

type OutputV3 = {
  type: 'output';
  children: any[];

  jupyter_data?: any;

  label?: string;
  identifier?: string;
  html_id?: string;
};

type OutputsV3 = {
  type: 'outputs';
  children: (OutputV2 | any)[];

  visibility?: any;
  id?: string;

  label?: string;
  identifier?: string;
  html_id?: string;
};

export function upgrade(file: IFile): IFile {
  const { version, mdast } = file;
  if (version !== 2) {
    throw new Error(`Version must be 2`);
  }
  const nodes = selectAll('output', mdast) as OutputV2[];
  nodes.forEach((node) => {
    const numOutputs = node.data?.length ?? 0;
    const children = node.children ?? [];
    const placeholders = children.filter((child) => !!child.placeholder);
    // We can only correlate output children with the IOutput objects if there's only one IOutput
    // Otherwise, drop them.
    const notPlaceholders = numOutputs === 1 ? children.filter((child) => !child.placeholder) : [];
    const outputsChildren = (node.data ?? []).map((outputData) => {
      const result: OutputV3 = {
        type: 'output',
        jupyter_data: outputData,
        // The first output gets all of the non-placeholders
        children: notPlaceholders.slice(),
      };
      notPlaceholders.length = 0;
      return result;
    });

    // Restore placeholders at the end
    outputsChildren.push(...placeholders);

    // Convert Output into Outputs
    if (node.data !== undefined) {
      delete node.data;
    }
    (node as any).type = 'outputs';
    (node as any).children = outputsChildren;
    // Carry forward node.id, and Target properties
  });
  return file;
}

export function downgrade(file: IFile): IFile {
  const { version, mdast } = file;
  if (version !== VERSION) {
    throw new Error(`Version must be ${VERSION}`);
  }
  const nodes = selectAll('outputs', mdast) as OutputsV3[];
  nodes.forEach((node) => {
    const data = node.children
      .filter((output) => output.type === 'output')
      .map((output: any) => output.jupyter_data)
      .filter((datum) => !!datum);

    const notPlaceholders = node.children.filter((child: any) => !child.placeholder);
    const children = notPlaceholders.map((output) => (output as OutputV3).children ?? []).flat();
    const placeholders = node.children.filter((child: any) => !!child.placeholder);
    children.push(...placeholders);

    // Convert Outputs into Output
    (node as any).data = data;

    (node as any).type = 'output';
    (node as any).children = children;
    // Carry forward node.id, and Target properties
  });
  return file;
}
