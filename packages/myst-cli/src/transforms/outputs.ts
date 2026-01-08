import fs from 'node:fs';
import { join } from 'node:path';
import { computeHash } from 'myst-cli-utils';
import type { SourceFileKind, Output, InlineExpression } from 'myst-spec-ext';
import { fileError, RuleId, fileWarn } from 'myst-common';
import type { GenericNode, GenericParent, IExpressionResult } from 'myst-common';
import type { ProjectSettings } from 'myst-frontmatter';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import type { IOutput, IMimeBundle } from '@jupyterlab/nbformat';
import type { MinifiedContent } from 'nbtx';
import { ensureString, extFromMimeType, minifyCellOutput, walkOutputs } from 'nbtx';
import { castSession } from '../session/cache.js';
import type { ISession } from '../session/types.js';
import { resolveOutputPath } from './images.js';
import type { StaticPhrasingContent } from 'myst-spec';
import type { MystParser, MimeRenderer } from './rendermime.js';
import { MIME_RENDERERS as DEFAULT_MIME_RENDERERS } from './rendermime.js';

function getFilename(hash: string, contentType: string) {
  return `${hash}${extFromMimeType(contentType)}`;
}

function getWriteDestination(hash: string, contentType: string, writeFolder: string) {
  return join(writeFolder, getFilename(hash, contentType));
}

export interface LiftOptions {
  parseMyst: MystParser;
  renderers?: MimeRenderer[];
}

/**
 * Lift inline expressions from display data to AST nodes
 */
export async function liftExpressions(mdast: GenericParent, file: VFile, opts: LiftOptions) {
  const renderers = opts.renderers ?? DEFAULT_MIME_RENDERERS;
  const nodes = selectAll('inlineExpression', mdast) as InlineExpression[];
  for (const node of nodes) {
    if (!node.result) {
      continue;
    }
    const result = node.result as IExpressionResult;
    if (result?.status !== 'ok') {
      continue;
    }
    const mimeTypes = [...Object.keys(result.data)];
    // Find the preferred mime type
    const preferredMimeRenderer = renderers
      .map((renderer): [string | undefined, MimeRenderer] => [
        renderer.renders(mimeTypes),
        renderer,
      ])
      .find(([mimeType]) => mimeType !== undefined) as [string, MimeRenderer] | undefined;

    // If we don't need to process any of these MIME types, skip.
    if (preferredMimeRenderer === undefined) {
      fileWarn(file, 'Unrecognized MIME bundle for inline content', {
        node,
        ruleId: RuleId.inlineExpressionRenders,
      });
      break;
    }
    const [contentType, renderer] = preferredMimeRenderer;

    // Pull content from cache if minified
    const content = (result.data as IMimeBundle)[contentType!];
    const children = await renderer.renderPhrasing(contentType, content, file, opts.parseMyst, {
      stripQuotes: (result.metadata?.['strip-quotes'] as any) ?? true,
    });
    node.children = children as StaticPhrasingContent[];
  }
}

/**
 * Lift inline expressions from display data to AST nodes
 */
export async function liftOutputs(mdast: GenericParent, file: VFile, opts: LiftOptions) {
  const renderers = opts.renderers ?? DEFAULT_MIME_RENDERERS;
  for (const node of selectAll('output', mdast)) {
    const jupyterOutput = (node as any).jupyter_data;

    // Do we have a MIME bundle?
    switch (jupyterOutput.output_type) {
      case 'error':
      case 'stream': {
        break;
      }
      // TODO: take latest by ID
      case 'execute_result':
      case 'update_display_data':
      case 'display_data': {
        // Find the preferred mime type
        const mimeTypes = [...Object.keys(jupyterOutput.data as IMimeBundle)];
        const preferredMimeRenderer = renderers
          .map((renderer): [string | undefined, MimeRenderer] => [
            renderer.renders(mimeTypes),
            renderer,
          ])
          .find(([mimeType]) => mimeType !== undefined);

        // If we don't need to process any of these MIME types, skip.
        if (preferredMimeRenderer === undefined) {
          fileWarn(file, 'Unrecognized MIME bundle for output content', {
            node,
            ruleId: RuleId.inlineExpressionRenders,
          });
          break;
        }
        const [contentType, renderer] = preferredMimeRenderer;

        // Pull content from cache if minified
        const content = (jupyterOutput.data as IMimeBundle)[contentType!];
        (node as any).children = await renderer.renderBlock(
          contentType!,
          content,
          file,
          opts.parseMyst,
          {
            stripQuotes: (jupyterOutput.metadata?.['strip-quotes'] as any) ?? true,
          },
        );
        break;
      }
    }
  }
}

export async function transformLiftExecutionResults(
  mdast: GenericParent,
  vfile: VFile,
  opts: LiftOptions,
) {
  await liftOutputs(mdast, vfile, opts);
  await liftExpressions(mdast, vfile, opts);
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
  const outputsNodes = selectAll('outputs', mdast) as GenericNode[];
  const cache = castSession(session);
  await Promise.all(
    outputsNodes
      // Ignore outputs that are hidden
      .filter((outputs) => outputs.visibility !== 'remove')
      // Pull out children
      .map((outputs) => outputs.children as Output[])
      .flat()
      // Filter outputs with no data
      // TODO: can this ever occur?
      .filter((output) => (output as any).jupyter_data !== undefined)
      // Minify output data
      .map(async (output) => {
        [(output as any).jupyter_data] = await minifyCellOutput(
          [(output as any).jupyter_data] as IOutput[],
          cache.$outputs,
          {
            computeHash,
            maxCharacters: opts?.minifyMaxCharacters,
          },
        );
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
    outputs
      .filter((output) => {
        const data = output.jupyter_data;

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
          return doRemove;
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
          return doRemove;
        }
        if (
          mpl !== 'show' &&
          data.output_type === 'execute_result' &&
          Object.keys(data.data).length === 1 &&
          data.data['text/plain']
        ) {
          const content = data.data['text/plain'].content;
          if (!stringIsMatplotlibOutput(content)) return false;
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
          return doRemove;
        }
        return false;
      })
      .forEach((output) => {
        output.type = '__delete__';
      });
  });
  remove(mdast, { cascade: false }, '__delete__');
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

  outputs
    .filter((output) => !!output.jupyter_data)
    .forEach((node) => {
      // TODO: output-refactoring -- drop to single output in future
      walkOutputs([node.jupyter_data], (obj) => {
        const { hash } = obj;
        if (!hash || !cache.$outputs[hash]) return undefined;
        obj.path = writeCachedOutputToFile(session, hash, cache.$outputs[hash], writeFolder, {
          ...opts,
          node,
        });
      });
    });
}
