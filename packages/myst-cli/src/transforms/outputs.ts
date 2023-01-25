import fs from 'fs';
import path from 'path';
import type { GenericNode } from 'myst-common';
import { selectAll } from 'unist-util-select';
import type { IOutput } from '@jupyterlab/nbformat';
import type { MinifiedMimePayload } from 'nbtx';
import { extFromMimeType, minifyCellOutput, walkOutputs } from 'nbtx';
import type { Root } from 'mdast';
import { castSession } from '../session';
import type { ISession } from '../session/types';
import { KINDS } from './types';
import { computeHash } from '../utils/computeHash';
import { resolveOutputPath } from './images';

export async function transformOutputs(
  session: ISession,
  mdast: Root,
  kind: KINDS,
  writeFolder: string,
  opts?: { altOutputFolder?: string },
) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  const cache = castSession(session);
  if (outputs.length && kind === KINDS.Article) {
    await Promise.all(
      outputs.map(async (output) => {
        output.data = await minifyCellOutput(output.data as IOutput[], cache.$outputs, {
          computeHash,
        });
      }),
    );
  }

  outputs.forEach((node) => {
    walkOutputs(node.data, (obj) => {
      if (!obj.hash || !cache.$outputs[obj.hash]) return undefined;
      const [content, { contentType, encoding }] = cache.$outputs[obj.hash];
      const filename = `${obj.hash}${extFromMimeType(contentType)}`;
      const destination = path.join(writeFolder, filename);

      if (fs.existsSync(destination)) {
        session.log.debug(`Cached file found for notebook output: ${destination}`);
      } else {
        try {
          if (!fs.existsSync(writeFolder)) fs.mkdirSync(writeFolder, { recursive: true });
          fs.writeFileSync(destination, content, { encoding: encoding as BufferEncoding });
          session.log.debug(`Notebook output successfully written: ${destination}`);
        } catch {
          session.log.error(`Error writing notebook output: ${destination}`);
          return undefined;
        }
      }
      obj.path = resolveOutputPath(filename, writeFolder, opts?.altOutputFolder);
    });
  });
}

/**
 * Convert output nodes to image or code
 *
 * Note: this only supports mime payloads, not error or stream outputs.
 * It also only supports minified images (i.e. images cannot be too small) or
 * non-minified text (i.e. text cannot be too large).
 */
export function reduceOutputs(mdast: Root) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  outputs.forEach((node) => {
    let selectedOutput: MinifiedMimePayload | undefined;
    walkOutputs(node.data, (obj) => {
      if (selectedOutput || typeof obj.content_type !== 'string') return;
      if (
        (obj.content_type.startsWith('image/') && obj.path) ||
        (obj.content_type.startsWith('text/') && obj.content)
      ) {
        selectedOutput = obj as MinifiedMimePayload;
      }
    });
    if (!selectedOutput) return;
    if (selectedOutput.content_type.startsWith('image/') && selectedOutput.path) {
      node.type = 'image';
      node.url = selectedOutput.path;
      node.urlSource = selectedOutput.path;
      delete node.data;
      delete node.id;
    }
    if (selectedOutput.content_type.startsWith('text/') && selectedOutput.content) {
      node.type = 'code';
      node.value = selectedOutput.content;
      delete node.data;
      delete node.id;
    }
  });
}
