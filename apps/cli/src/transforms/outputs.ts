import { GenericNode, selectAll } from 'mystjs';
import { CellOutput, KINDS } from '@curvenote/blocks';
import { minifyCellOutput, walkPaths } from '@curvenote/nbtx';
import { Root } from '../myst';
import { ISession } from '../session';
import { publicPath } from '../utils';
import { createWebFileObjectFactory } from '../web/files';

export async function transformOutputs(session: ISession, mdast: Root, kind: KINDS) {
  const outputs = selectAll('output', mdast) as GenericNode[];

  if (outputs && kind === KINDS.Article) {
    const fileFactory = createWebFileObjectFactory(session.log, publicPath(session), '_static', {
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
