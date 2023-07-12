import fs from 'node:fs';
import { join } from 'node:path';
import { computeHash } from 'myst-cli-utils';
import { SourceFileKind } from 'myst-spec-ext';
import type { GenericNode } from 'myst-common';
import stripAnsi from 'strip-ansi';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import type { IOutput } from '@jupyterlab/nbformat';
import { extFromMimeType, minifyCellOutput, walkOutputs } from 'nbtx';
import type { Root } from 'mdast';
import { castSession } from '../session/index.js';
import type { ISession } from '../session/types.js';
import { resolveOutputPath } from './images.js';

export async function transformOutputs(
  session: ISession,
  mdast: Root,
  kind: SourceFileKind,
  writeFolder: string,
  opts?: { altOutputFolder?: string; minifyMaxCharacters?: number },
) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  const cache = castSession(session);
  if (outputs.length && kind === SourceFileKind.Article) {
    await Promise.all(
      outputs.map(async (output) => {
        output.data = await minifyCellOutput(output.data as IOutput[], cache.$outputs, {
          computeHash,
          maxCharacters: opts?.minifyMaxCharacters,
        });
      }),
    );
  }

  outputs.forEach((node) => {
    walkOutputs(node.data, (obj) => {
      if (!obj.hash || !cache.$outputs[obj.hash]) return undefined;
      const [content, { contentType, encoding }] = cache.$outputs[obj.hash];
      const filename = `${obj.hash}${extFromMimeType(contentType)}`;
      const destination = join(writeFolder, filename);

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
export function reduceOutputs(mdast: Root, writeFolder: string) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  outputs.forEach((node) => {
    if (!node.data?.length) {
      node.type = '__delete__';
      return;
    }
    let selectedOutput: { content_type: string; path: string; hash: string } | undefined;
    walkOutputs(node.data, (obj: any) => {
      if (selectedOutput || !obj.path || !obj.hash) return;
      if (['error', 'stream'].includes(obj.output_type)) {
        const { path, hash } = obj;
        selectedOutput = { content_type: 'text/plain', path, hash };
      } else if (typeof obj.content_type === 'string') {
        const { content_type, path, hash } = obj;
        if (obj.content_type.startsWith('image/') || obj.content_type === 'text/plain') {
          selectedOutput = { content_type, path, hash };
        }
      }
    });
    if (selectedOutput?.content_type.startsWith('image/')) {
      node.type = 'image';
      node.url = selectedOutput.path;
      node.urlSource = selectedOutput.path;
      delete node.data;
      delete node.id;
    } else if (selectedOutput?.content_type === 'text/plain') {
      node.type = 'code';
      const filename = `${selectedOutput.hash}${extFromMimeType(selectedOutput.content_type)}`;
      const content = fs.readFileSync(join(writeFolder, filename), 'utf-8');
      node.value = stripAnsi(content);
      delete node.data;
      delete node.id;
    }
  });
  remove(mdast, '__delete__');
}
