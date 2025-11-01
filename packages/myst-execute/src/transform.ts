import { select } from 'unist-util-select';
import type { Logger } from 'myst-cli-utils';
import type { PageFrontmatter, KernelSpec } from 'myst-frontmatter';
import type { SessionManager } from '@jupyterlab/services';
import type { Code } from 'myst-spec-ext';
import type { GenericParent } from 'myst-common';
import { fileError } from 'myst-common';
import type { VFile } from 'vfile';
import assert from 'node:assert';
import type { Plugin } from 'unified';
import { createHash } from 'node:crypto';
import type { ICache } from './cache.js';
import { createKernelConnection } from './kernel.js';
import { isCellBlock, isInlineExpression, codeBlockRaisesException } from './utils.js';
import type { ExecutableNode, ExecutionResult } from './types.js';
import {
  getExecutableNodes,
  computeExecutableNodes,
  applyComputedOutputsToNodes,
} from './execute.js';
/**
 * Build a cache key from an array of executable nodes
 *
 * @param nodes array of executable nodes
 */
function buildCacheKey(kernelSpec: KernelSpec, nodes: ExecutableNode[]): string {
  // Build an array of hashable items from an array of nodes
  const hashableItems: {
    kind: string;
    content: string;
    raisesException: boolean;
  }[] = [];
  for (const node of nodes) {
    if (isCellBlock(node)) {
      hashableItems.push({
        kind: node.type,
        content: (select('code', node) as Code).value,
        raisesException: codeBlockRaisesException(node),
      });
    } else {
      assert(isInlineExpression(node));
      hashableItems.push({
        kind: node.type,
        content: node.value,
        raisesException: false,
      });
    }
  }

  // Build a hash from notebook state
  return createHash('md5')
    .update(kernelSpec.name)
    .update(JSON.stringify(hashableItems))
    .digest('hex');
}

export type Options = {
  basePath: string;
  cache: ICache<ExecutionResult[]>;
  sessionFactory: () => Promise<SessionManager | undefined>;
  frontmatter: PageFrontmatter;
  ignoreCache?: boolean;
  errorIsFatal?: boolean;
  log?: Logger;
};

/**
 * Transform an AST to include the outputs of executing the given notebook
 *
 * @param tree
 * @param vfile
 * @param opts
 */
export async function kernelExecutionTransform(tree: GenericParent, vfile: VFile, opts: Options) {
  const log = opts.log ?? console;

  const kernelspec = opts.frontmatter.kernelspec;
  // We need the kernelspec to proceed
  if (kernelspec === undefined) {
    return fileError(
      vfile,
      `Notebook does not declare the necessary 'kernelspec' frontmatter key required for execution`,
    );
  }

  const executableNodes = getExecutableNodes(tree);
  // Only do something if we have any nodes!
  if (executableNodes.length === 0) {
    return;
  }

  // See if we already cached this execution
  const cacheKey = buildCacheKey(kernelspec, executableNodes);
  let cachedResults = opts.cache.get(cacheKey);

  // Do we need to re-execute notebook?
  if (!opts.ignoreCache && cachedResults !== undefined) {
    // Apply results to tree
    log.info(`💾 Adding Cached Notebook Outputs (${vfile.path})`);
    applyComputedOutputsToNodes(executableNodes, cachedResults);
    return;
  }
  log.info(
    `💿 Executing Notebook (${vfile.path}) ${
      opts.ignoreCache ? '[cache ignored]' : '[no execution cache found]'
    }`,
  );
  const sessionManager = await opts.sessionFactory();
  // Do we not have a working session?
  if (sessionManager === undefined) {
    fileError(vfile, `Could not load Jupyter session manager to run executable nodes`, {
      fatal: opts.errorIsFatal,
    });
    return;
  }
  // Otherwise, boot up a kernel, and execute each cell
  const sessionConnection = await createKernelConnection(
    sessionManager,
    opts.basePath,
    kernelspec,
    vfile,
  );
  if (sessionConnection === undefined) {
    log.error(`Unable to create a new kernel ${kernelspec.name}`);
    return;
  }
  const { kernel } = sessionConnection;
  log.debug(`Connected to kernel ${kernel.name}`);
  try {
    // Execute notebook
    const { results, errorOccurred } = await computeExecutableNodes(kernel, executableNodes, {
      vfile,
    });
    // Populate cache if things were successful
    if (!errorOccurred) {
      opts.cache.set(cacheKey, results);
    }
    // Refer to these computed results
    cachedResults = results;
    // Apply results to tree
    applyComputedOutputsToNodes(executableNodes, cachedResults);
  } finally {
    // Ensure that we shut-down the kernel
    sessionConnection.shutdown();
  }
}

export const kernelExecutionPlugin: Plugin<[Options], GenericParent, GenericParent> =
  (opts) => async (tree, file) => {
    await kernelExecutionTransform(tree, file, opts);
  };
