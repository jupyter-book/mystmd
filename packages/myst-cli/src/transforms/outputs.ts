import path from 'path';
import type { GenericNode } from 'mystjs';
import { selectAll } from 'mystjs';
import type { CellOutput } from '@curvenote/blocks';
import { KINDS } from '@curvenote/blocks';
import { minifyCellOutput, walkPaths } from '@curvenote/nbtx';
import type { Root } from 'mdast';
import type { ISession } from '../session/types';
import { createWebFileObjectFactory } from '../utils';

export async function transformOutputs(session: ISession, mdast: Root, kind: KINDS) {
  const outputs = selectAll('output', mdast) as GenericNode[];

  if (outputs.length && kind === KINDS.Article) {
    const fileFactory = createWebFileObjectFactory(session.log, session.publicPath(), '_static', {
      useHash: true,
    });
    await Promise.all(
      outputs.map(async (output) => {
        output.data = await minifyCellOutput(
          fileFactory,
          output.data as CellOutput[],
          { basepath: '' }, // fileFactory takes care of this
        );
      }),
    );
  }

  outputs.forEach((node) => {
    walkPaths(node.data, (p: string, obj: any) => {
      obj.path = `/${p}`;
      obj.content = `/${obj.content}`;
    });
  });
}
