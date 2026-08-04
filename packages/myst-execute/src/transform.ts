import { select } from 'unist-util-select';
import type { Logger } from 'myst-cli-utils';
import type { PageFrontmatter, KernelSpec } from 'myst-frontmatter';
import type { SessionManager } from '@jupyterlab/services';
import type { Code } from 'myst-spec';
import type { GenericParent } from 'myst-common';
import { fileError } from 'myst-common';
import type { VFile } from 'vfile';
import assert from 'node:assert';
import path from 'node:path';
import type { Plugin } from 'unified';
import { createHash } from 'node:crypto';
import type { IDocumentExecutionCache } from './cache.js';
import { createKernelConnection } from './kernel.js';
import { isCodeBlock, isInlineExpression, codeBlockRaisesException } from './utils.js';
import type { ExecutableNode } from './types.js';
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
function buildCacheKey(
  kernelSpec: KernelSpec,
  nodes: ExecutableNode[],
  envVars: Record<string, string | undefined>,
): string {
  // Build an array of hashable items from an array of nodes
  const hashableItems: {
    kind: string;
    content: string;
    raisesException: boolean;
  }[] = [];
  for (const node of nodes) {
    if (isCodeBlock(node)) {
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
  // Order hashable environment variable keys, to ensure determinism
  const envKeys = Object.keys(envVars).sort();
  const hashableEnv = Object.fromEntries(envKeys.map((n) => [n, envVars[n]]));

  // Build a hash from notebook state
  const hash = createHash('md5').update(kernelSpec.name).update(JSON.stringify(hashableItems));
  // Tack on hash of env vars. The if() prevents empty env-var objects breaking existing caches
  if (envKeys.length) {
    hash.update(JSON.stringify(hashableEnv));
  }
  return hash.digest('hex');
}

export type Options = {
  basePath: string;
  cache: IDocumentExecutionCache;
  sessionFactory: () => Promise<SessionManager | undefined>;
  frontmatter: PageFrontmatter;
  ignoreCache?: boolean;
  errorIsFatal?: boolean;
  log?: Logger;
};

function getCacheEnvironment(env: string[]) {
  return Object.fromEntries(env.map((name) => [name, process.env[name]]));
}

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
  const executeConfig = opts.frontmatter.execute;
  const executableNodes = getExecutableNodes(tree);
  // If there are no executable nodes then just return
  if (executableNodes.length === 0) {
    return;
  }

  // Requre kernelspec otherwise Jupyter doesn't know what kernel to use
  if (kernelspec === undefined) {
    fileError(
      vfile,
      `Notebook does not declare the necessary 'kernelspec' frontmatter key required for execution`,
    );
    return;
  }

  // See if we already cached this execution
  const cacheEnv = getCacheEnvironment(executeConfig?.depends_on_env ?? []);
  const cacheKey = buildCacheKey(kernelspec, executableNodes, cacheEnv);

  const cacheHit = opts.cache.get(cacheKey);
  let cachedResults = cacheHit?.results;

  const ignoreCachedDocument =
    // If we don't globally ignore caching'
    opts.ignoreCache ||
    // If this document hasn't opted out of cache'
    executeConfig?.cache === false;

  // Do we need to re-execute notebook?
  if (
    !ignoreCachedDocument &&
    // If we have a cached result
    cachedResults !== undefined
  ) {
    // Apply results to tree
    log.info(`💾 Adding cached notebook outputs (${vfile.path})`);
    applyComputedOutputsToNodes(executableNodes, cachedResults);
    return;
  }
  log.info(
    `💿 Executing notebook (${vfile.path}) ${
      ignoreCachedDocument ? '[cache ignored]' : '[no execution cache found]'
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
    log,
  );
  if (sessionConnection === undefined) {
    log.error(`Unable to create a new kernel ${kernelspec.name}`);
    return;
  }
  const { kernel } = sessionConnection;
  log.debug(`Connected to kernel ${kernel.name}`);

  // Execution count
  const startTimeNS = process.hrtime.bigint();
  try {
    // Execute notebook
    const { results, errorOccurred } = await computeExecutableNodes(kernel, executableNodes, {
      vfile,
    });
    const stopTimeNS = process.hrtime.bigint();
    // Populate cache if things were successful
    if (!errorOccurred) {
      opts.cache.set(cacheKey, {
        context: {
          kernelspec,
          path: path.basename(opts.basePath, vfile.path),
          timestamp: new Date().toISOString(),
          duration_ms: Number((stopTimeNS - startTimeNS) / 1_000_000n),
        },
        results,
      });
    }
    // Refer to these computed results
    cachedResults = results;
    // Apply results to tree
    applyComputedOutputsToNodes(executableNodes, cachedResults);
  } finally {
    // Ensure that we shut-down the kernel
    if (!sessionConnection.isDisposed) {
      await sessionConnection.shutdown();
    }
  }
}

export const kernelExecutionPlugin: Plugin<[Options], GenericParent, GenericParent> =
  (opts) => async (tree, file) => {
    await kernelExecutionTransform(tree, file, opts);
  };
