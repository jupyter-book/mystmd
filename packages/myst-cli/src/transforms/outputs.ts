import fs from 'fs';
import path from 'path';
import type { GenericNode } from 'mystjs';
import { selectAll } from 'unist-util-select';
import type { IOutput } from '@jupyterlab/nbformat';
import { extFromMimeType, minifyCellOutput, walkOutputs } from 'nbtx';
import type { Root } from 'mdast';
import { castSession } from '../session';
import type { ISession } from '../session/types';
import { KINDS } from './types';

export async function transformOutputs(session: ISession, mdast: Root, kind: KINDS) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  const cache = castSession(session);
  if (outputs.length && kind === KINDS.Article) {
    await Promise.all(
      outputs.map(async (output) => {
        output.data = await minifyCellOutput(output.data as IOutput[], cache.$outputs);
      }),
    );
  }

  outputs.forEach((node) => {
    walkOutputs(node.data, (hash: string, obj: any) => {
      if (!cache.$outputs[hash]) return undefined;
      const [content, { contentType, encoding }] = cache.$outputs[hash];
      const folder = session.staticPath();
      const filename = `${hash}${extFromMimeType(contentType)}`;
      const destination = path.join(folder, filename);

      if (fs.existsSync(destination)) {
        session.log.debug(`Cached file found for notebook output: ${destination}`);
      } else {
        try {
          if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
          fs.writeFileSync(destination, content, { encoding: encoding as BufferEncoding });
          session.log.debug(`Notebook output successfully written: ${destination}`);
        } catch {
          session.log.error(`Error writing notebook output: ${destination}`);
          return undefined;
        }
      }
      obj.path = `/_static/${filename}`;
    });
  });
}
