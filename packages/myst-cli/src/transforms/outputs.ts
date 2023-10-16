import fs from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { computeHash } from 'myst-cli-utils';
import type { Image } from 'myst-spec-ext';
import { SourceFileKind } from 'myst-spec-ext';
import { liftChildren, fileError, RuleId } from 'myst-common';
import type { GenericNode, GenericParent } from 'myst-common';
import stripAnsi from 'strip-ansi';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import type { IOutput } from '@jupyterlab/nbformat';
import type { MinifiedOutput } from 'nbtx';
import { extFromMimeType, minifyCellOutput, walkOutputs } from 'nbtx';
import { castSession } from '../session/index.js';
import type { ISession } from '../session/types.js';
import { resolveOutputPath } from './images.js';

function getFilename(hash: string, contentType: string) {
  return `${hash}${extFromMimeType(contentType)}`;
}

function getDestination(hash: string, contentType: string, writeFolder: string) {
  return join(writeFolder, getFilename(hash, contentType));
}

export async function transformOutputs(
  session: ISession,
  mdast: GenericParent,
  kind: SourceFileKind,
  writeFolder: string,
  opts?: { altOutputFolder?: string; minifyMaxCharacters?: number; vfile?: VFile },
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
      const filename = getFilename(obj.hash, contentType);
      const destination = getDestination(obj.hash, contentType, writeFolder);

      if (fs.existsSync(destination)) {
        session.log.debug(`Cached file found for notebook output: ${destination}`);
      } else {
        try {
          if (!fs.existsSync(writeFolder)) fs.mkdirSync(writeFolder, { recursive: true });
          fs.writeFileSync(destination, content, { encoding: encoding as BufferEncoding });
          session.log.debug(`Notebook output successfully written: ${destination}`);
        } catch {
          if (opts?.vfile) {
            fileError(opts.vfile, `Error writing notebook output: ${destination}`, {
              node,
              ruleId: RuleId.notebookOutputCopied,
            });
          }
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
export function reduceOutputs(
  session: ISession,
  mdast: GenericParent,
  file: string,
  writeFolder: string,
) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  const unusedOutputs: string[] = [];
  outputs.forEach((node) => {
    if (!node.data?.length) {
      node.type = '__delete__';
      return;
    }
    const selectedOutputs: { content_type: string; path: string; hash: string }[] = [];
    node.data.forEach((output: MinifiedOutput) => {
      let selectedOutput: { content_type: string; path: string; hash: string } | undefined;
      walkOutputs([output], (obj: any) => {
        const { output_type, content_type, path, hash } = obj;
        if (!selectedOutput && path && hash) {
          if (['error', 'stream'].includes(output_type)) {
            selectedOutput = { content_type: 'text/plain', path, hash };
          } else if (typeof content_type === 'string') {
            if (content_type.startsWith('image/') || content_type === 'text/plain') {
              selectedOutput = { content_type, path, hash };
            }
          }
        } else if (hash && content_type) {
          unusedOutputs.push(getDestination(hash, content_type, writeFolder));
        }
      });
      if (selectedOutput) selectedOutputs.push(selectedOutput);
    });
    const children: (Image | GenericNode)[] = selectedOutputs
      .map((output): Image | GenericNode | undefined => {
        if (output?.content_type.startsWith('image/')) {
          const relativePath = relative(dirname(file), output.path);
          return {
            type: 'image',
            data: { type: 'output' },
            url: relativePath,
            urlSource: relativePath,
          };
        } else if (output?.content_type === 'text/plain' && output?.hash) {
          const destination = getDestination(output.hash, output.content_type, writeFolder);
          unusedOutputs.push(destination);
          const content = fs.readFileSync(destination, 'utf-8');
          return {
            type: 'code',
            data: { type: 'output' },
            value: stripAnsi(content),
          };
        }
        return undefined;
      })
      .filter((output): output is Image | GenericNode => !!output);
    node.type = '__lift__';
    node.children = children;
  });
  remove(mdast, '__delete__');
  liftChildren(mdast, '__lift__');

  unusedOutputs.forEach((out) => {
    if (fs.existsSync(out)) {
      session.log.debug(`Removing temporary notebook output file: ${out}`);
      fs.rmSync(out);
    }
  });
}
