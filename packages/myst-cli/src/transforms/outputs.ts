import fs from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { computeHash } from 'myst-cli-utils';
import type { Image } from 'myst-spec-ext';
import { SourceFileKind } from 'myst-spec-ext';
import { liftChildren, fileError, RuleId, fileWarn } from 'myst-common';
import type { GenericNode, GenericParent } from 'myst-common';
import type { ProjectSettings } from 'myst-frontmatter';
import stripAnsi from 'strip-ansi';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import type { IOutput, IStream } from '@jupyterlab/nbformat';
import type { MinifiedContent, MinifiedOutput } from 'nbtx';
import { ensureString, extFromMimeType, minifyCellOutput, walkOutputs } from 'nbtx';
import { castSession } from '../session/cache.js';
import type { ISession } from '../session/types.js';
import { resolveOutputPath } from './images.js';

function getFilename(hash: string, contentType: string) {
  return `${hash}${extFromMimeType(contentType)}`;
}

function getWriteDestination(hash: string, contentType: string, writeFolder: string) {
  return join(writeFolder, getFilename(hash, contentType));
}

/**
 * Traverse all output nodes, minify their content, and cache on the session
 */
export async function transformOutputsToCache(
  session: ISession,
  mdast: GenericParent,
  kind: SourceFileKind,
  opts?: { minifyMaxCharacters?: number },
) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  // This happens sooner for notebooks
  if (!outputs.length || kind !== SourceFileKind.Article) return;
  const cache = castSession(session);
  await Promise.all(
    outputs.map(async (output) => {
      output.data = await minifyCellOutput(output.data as IOutput[], cache.$outputs, {
        computeHash,
        maxCharacters: opts?.minifyMaxCharacters,
      });
    }),
  );
}

/** Remove warnings and errors from outputs */
export function transformFilterOutputStreams(
  mdast: GenericParent,
  vfile: VFile,
  {
    output_stdout: stdout = 'show',
    output_stderr: stderr = 'show',
  }: Pick<ProjectSettings, 'output_stdout' | 'output_stderr'> = {},
) {
  if (stdout === 'show' && stderr === 'show') return;
  const outputs = selectAll('output', mdast) as GenericNode[];
  outputs.forEach((output) => {
    output.data = output.data.filter((data: IStream) => {
      if (stderr !== 'show' && data.output_type === 'stream' && data.name === 'stderr') {
        const doRemove = stderr.includes('remove');
        const doWarn = stderr.includes('warn');
        const doError = stderr.includes('error');
        if (doWarn || doError) {
          (doError ? fileError : fileWarn)(
            vfile,
            doRemove ? 'Removing stderr from outputs' : 'Output contains stderr',
            {
              node: output,
              note: ensureString(data.text),
            },
          );
        }
        return !doRemove;
      }
      if (stdout !== 'show' && data.output_type === 'stream' && data.name === 'stdout') {
        const doRemove = stdout.includes('remove');
        const doWarn = stdout.includes('warn');
        const doError = stdout.includes('error');
        if (doWarn || doError) {
          (doError ? fileError : fileWarn)(
            vfile,
            doRemove ? 'Removing stdout from outputs' : 'Output contains stdout',
            {
              node: output,
              note: ensureString(data.text),
            },
          );
        }
        return !doRemove;
      }
      return true;
    });
  });
}

function writeCachedOutputToFile(
  session: ISession,
  hash: string,
  cachedOutput: MinifiedContent,
  writeFolder: string,
  opts: { vfile?: VFile; node?: GenericNode; altOutputFolder?: string },
) {
  const [content, { contentType, encoding }] = cachedOutput;
  const filename = getFilename(hash, contentType);
  const destination = getWriteDestination(hash, contentType, writeFolder);

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
          node: opts.node,
          ruleId: RuleId.notebookOutputCopied,
        });
      }
      return undefined;
    }
  }
  return resolveOutputPath(filename, writeFolder, opts?.altOutputFolder);
}

/**
 * Write cached content from output nodes to file
 */
export function transformOutputsToFile(
  session: ISession,
  mdast: GenericParent,
  writeFolder: string,
  opts?: { altOutputFolder?: string; vfile?: VFile },
) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  const cache = castSession(session);

  outputs.forEach((node) => {
    walkOutputs(node.data, (obj) => {
      const { hash } = obj;
      if (!hash || !cache.$outputs[hash]) return undefined;
      obj.path = writeCachedOutputToFile(session, hash, cache.$outputs[hash], writeFolder, {
        ...opts,
        node,
      });
    });
  });
}

/**
 * Convert output nodes with minified content to image or code
 *
 * This writes outputs of type image to file, modifies outputs of type
 * text to a code node, and removes other output types.
 */
export function reduceOutputs(
  session: ISession,
  mdast: GenericParent,
  file: string,
  writeFolder: string,
  opts?: { altOutputFolder?: string; vfile?: VFile },
) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  const cache = castSession(session);
  outputs.forEach((node) => {
    if (!node.data?.length) {
      node.type = '__delete__';
      return;
    }
    const selectedOutputs: { content_type: string; hash: string }[] = [];
    node.data.forEach((output: MinifiedOutput) => {
      let selectedOutput: { content_type: string; hash: string } | undefined;
      walkOutputs([output], (obj: any) => {
        const { output_type, content_type, hash } = obj;
        if (!hash) return undefined;
        if (!selectedOutput) {
          if (['error', 'stream'].includes(output_type)) {
            selectedOutput = { content_type: 'text/plain', hash };
          } else if (typeof content_type === 'string') {
            if (content_type.startsWith('image/') || content_type === 'text/plain') {
              selectedOutput = { content_type, hash };
            }
          }
        }
      });
      if (selectedOutput) selectedOutputs.push(selectedOutput);
    });
    const children: (Image | GenericNode)[] = selectedOutputs
      .map((output): Image | GenericNode | undefined => {
        const { content_type, hash } = output ?? {};
        if (!hash || !cache.$outputs[hash]) return undefined;
        if (content_type.startsWith('image/')) {
          const path = writeCachedOutputToFile(session, hash, cache.$outputs[hash], writeFolder, {
            ...opts,
            node,
          });
          if (!path) return undefined;
          const relativePath = relative(dirname(file), path);
          return {
            type: 'image',
            data: { type: 'output' },
            url: relativePath,
            urlSource: relativePath,
          };
        } else if (content_type === 'text/plain' && cache.$outputs[hash]) {
          const [content] = cache.$outputs[hash];
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
}
