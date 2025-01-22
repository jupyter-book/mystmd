import fs from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { computeHash } from 'myst-cli-utils';
import type { Image, SourceFileKind } from 'myst-spec-ext';
import { liftChildren, fileError, RuleId, fileWarn } from 'myst-common';
import type { GenericNode, GenericParent } from 'myst-common';
import type { ProjectSettings } from 'myst-frontmatter';
import { htmlTransform } from 'myst-transforms';
import stripAnsi from 'strip-ansi';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import type { IOutput, IStream } from '@jupyterlab/nbformat';
import type { MinifiedContent, MinifiedOutput, MinifiedMimeOutput } from 'nbtx';
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

const MARKDOWN_MIME_TYPE = 'text/markdown';
const SUPPORTED_MARKDOWN_VARIANTS = ['Original', 'GFM', 'CommonMark', 'myst'];

/**
 * Extract the `variant` parameter from a Markdown MIME type
 *
 * @param mimeType MIME type of the form `text/markdown;FOO=BAR`
 */
function extractVariantParameter(mimeType: string): string | undefined {
  const [variant] = Array.from(mimeType.matchAll(/;([^;]+)=([^;]+)/g))
    .filter(([name]) => name === 'variant')
    .map((pair) => pair[1]);
  return variant;
}

function preferredMarkdownMIMEType(
  mimeType: string,
): { variant?: string; mimeType: string } | undefined {
  if (!mimeType.startsWith(MARKDOWN_MIME_TYPE)) {
    return;
  }
  const variant = extractVariantParameter(mimeType);
  if (!variant) {
    return { mimeType };
  }
  if (SUPPORTED_MARKDOWN_VARIANTS.includes(variant)) {
    return { mimeType, variant };
  }

  return;
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
  if (!outputs.length) return;
  const cache = castSession(session);
  await Promise.all(
    outputs
      .filter((output) => output.visibility !== 'remove')
      .map(async (output) => {
        const [tmpData] = await minifyCellOutput([output.data] as IOutput[], cache.$outputs, {
          computeHash,
          maxCharacters: opts?.minifyMaxCharacters,
        });
        output.data = tmpData;
      }),
  );
}

export function stringIsMatplotlibOutput(value?: string): boolean {
  if (!value) return false;
  // We can add more when we find them...
  const match =
    value.match(/<(Figure|Text|matplotlib)(.*)at ([0-9a-z]+)>/) ||
    value.match(/^<(Figure|Text|AxesSubplot|module)(.*)>$/) ||
    value.match(/^(Text)\((.*)\)$/);
  return !!match;
}

/** Remove warnings and errors from outputs */
export function transformFilterOutputStreams(
  mdast: GenericParent,
  vfile: VFile,
  {
    output_stdout: stdout = 'show',
    output_stderr: stderr = 'show',
    output_matplotlib_strings: mpl = 'remove-warn',
  }: Pick<ProjectSettings, 'output_stdout' | 'output_stderr' | 'output_matplotlib_strings'> = {},
) {
  const blocks = selectAll('block', mdast) as GenericNode[];
  blocks.forEach((block) => {
    const tags: string[] = Array.isArray(block.data?.tags) ? block.data.tags : [];
    const blockRemoveStderr = tags.includes('remove-stderr');
    const blockRemoveStdout = tags.includes('remove-stdout');
    const outputs = selectAll('output', block) as GenericNode[];
    // There should be only one output in the block
    outputs.forEach((output) => {
      if (!output.data) {
        return;
      }
      console.log(JSON.stringify(output.data, null, 2));
      output.data = [output.data].filter((data: IStream | MinifiedMimeOutput) => {
        if (
          (stderr !== 'show' || blockRemoveStderr) &&
          data.output_type === 'stream' &&
          data.name === 'stderr'
        ) {
          const doRemove = stderr.includes('remove') || blockRemoveStderr;
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
        if (
          (stdout !== 'show' || blockRemoveStdout) &&
          data.output_type === 'stream' &&
          data.name === 'stdout'
        ) {
          const doRemove = stdout.includes('remove') || blockRemoveStdout;
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
        if (
          mpl !== 'show' &&
          data.output_type === 'execute_result' &&
          Object.keys(data.data).length === 1 &&
          data.data['text/plain']
        ) {
          const content = data.data['text/plain'].content;
          if (!stringIsMatplotlibOutput(content)) return true;
          const doRemove = mpl.includes('remove');
          const doWarn = mpl.includes('warn');
          const doError = mpl.includes('error');
          if (doWarn || doError) {
            (doError ? fileError : fileWarn)(
              vfile,
              doRemove
                ? 'Removing matplotlib string from outputs'
                : 'Output contains matplotlib string',
              {
                node: output,
                note: `${content}\n   Fix: Put a semicolon on the last line of your cell or add "output_matplotlib_strings: remove" to the project settings.`,
              },
            );
          }
          return !doRemove;
        }
        return true;
      })[0];
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
    const rawOutputs = node.data === undefined ? [] : [node.data];
    walkOutputs(rawOutputs, (obj) => {
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
 * Return if new type is preferred output content_type over existing type
 *
 * Since this is for static output, images are top preference, then
 * html, then text.
 *
 * If the new and existing types are the same, always just keep existing.
 */
function isPreferredOutputType(newType: string, existingType: string) {
  const newIndex = PREFERRED_MIME_TYPES.findIndex((fn) => fn(newType));
  const existingIndex = PREFERRED_MIME_TYPES.findIndex((fn) => fn(existingType));
  if (newIndex === -1) {
    return false;
  } else if (existingIndex === -1) {
    return true;
  } else {
    return newIndex < existingIndex;
  }
}
/**
 * Lift the children of outputs nodes into their parents
 */
export function transformLiftOutputs(mdast: GenericParent) {
  const outputsNodes = selectAll('outputs', mdast) as GenericNode[];
  outputsNodes.forEach((node) => {
    // Lift all output nodes
    const outputNodes = selectAll('output', node) as GenericNode[];
    outputNodes.forEach((outputNode) => {
      outputNode.type = '__lift__';
    });
    // Lift the outputs node
    node.type = '__lift__';
  });
  liftChildren(mdast, '__lift__');
}

export const PREFERRED_MIME_TYPES: Array<(mime: string) => boolean> = [
  // Markdown (any variant)
  (mime) => !!preferredMarkdownMIMEType(mime),
  // Image (any type)
  (mime) => mime.startsWith('image'),
  (mime) => mime === 'text/html',
  (mime) => mime === 'text/plain',
];

/**
 * Convert output nodes with minified content to image or code
 *
 * This writes outputs of type image to file, modifies outputs of type
 * text to a code node, and removes other output types.
 */
export function transformReduceOutputs(
  session: ISession,
  mdast: GenericParent,
  file: string,
  writeFolder: string,
  opts?: { altOutputFolder?: string; vfile?: VFile },
) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  const cache = castSession(session);
  outputs.forEach((node) => {
    if (!node.data) {
      return;
    }
    const selectedOutputs: { content_type: string; hash: string }[] = [];
    const rawOutputs = node.data === undefined ? [] : [node.data];
    rawOutputs.forEach((output: MinifiedOutput) => {
      let selectedOutput: { content_type: string; hash: string } | undefined;
      walkOutputs([output], (obj: any) => {
        const { output_type, content_type, hash } = obj;
        if (!hash) return undefined;
        if (!selectedOutput || isPreferredOutputType(content_type, selectedOutput.content_type)) {
          // Check output type
          if (['error', 'stream'].includes(output_type)) {
            selectedOutput = { content_type: 'text/plain', hash };
          }
          // Check content type
          else if (typeof content_type === 'string') {
            const preferredMime = PREFERRED_MIME_TYPES.some((matcher) => !!matcher(content_type));
            if (preferredMime) {
              selectedOutput = { content_type, hash };
            }
          }
        }
      });
      if (selectedOutput) selectedOutputs.push(selectedOutput);
    });
    const children: (Image | GenericNode)[] = selectedOutputs
      .map((output): Image | GenericNode | GenericNode[] | undefined => {
        const { content_type, hash } = output ?? {};
        if (!hash || !cache.$outputs[hash]) return undefined;
        if (content_type === 'text/html') {
          const htmlTree = {
            type: 'root',
            children: [
              {
                type: 'html',
                value: cache.$outputs[hash][0],
              },
            ],
          };
          htmlTransform(htmlTree);
          return htmlTree.children;
        } else if (content_type.startsWith('image/')) {
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
      .flat()
      .filter((output): output is Image | GenericNode => !!output);
    node.children = children;
  });
}
