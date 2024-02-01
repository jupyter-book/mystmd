import { select, selectAll } from 'unist-util-select';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { Kernel, KernelMessage, Session, SessionManager } from '@jupyterlab/services';
import type { Code, InlineExpression } from 'myst-spec-ext';
import type { IOutput } from '@jupyterlab/nbformat';
import type { GenericNode, GenericParent, IExpressionResult } from 'myst-common';
import { fileError, fileInfo, fileWarn } from 'myst-common';
import type { VFile } from 'vfile';
import path from 'node:path';
import assert from 'node:assert';
import { createHash } from 'node:crypto';
import type { Plugin } from 'unified';
import type { ICache } from './cache.js';

/**
 * Interpret an IOPub message as an IOutput object
 *
 * @param msg IOPub message
 */
function IOPubAsOutput(msg: KernelMessage.IIOPubMessage): IOutput {
  return {
    output_type: msg.header.msg_type,
    ...msg.content,
  };
}

/**
 * Execute a code string in the given kernel, returning any outputs.
 *
 * @param kernel connection to an active kernel
 * @param code code to execute
 */
async function executeCode(kernel: Kernel.IKernelConnection, code: string) {
  const future = kernel.requestExecute({
    code: code,
  });

  const outputs: IOutput[] = [];
  future.onIOPub = (msg) => {
    // Only listen for replies to this execution
    if (
      (msg.parent_header as any).msg_id !== future.msg.header.msg_id ||
      (msg.parent_header as any).msg_type !== 'execute_request'
    ) {
      console.debug('Ignoring IOPub reply');
      return;
    }
    switch (msg.header.msg_type) {
      case 'stream':
      case 'execute_result':
      case 'error':
      case 'display_data':
        outputs.push(IOPubAsOutput(msg));
        break;
      default:
        console.debug(`Ignoring IOPub reply (unexpected message type ${msg.header.msg_type})`);
        return;
    }
  };
  let status: 'abort' | 'error' | 'ok' | undefined;
  future.onReply = (msg: KernelMessage.IExecuteReplyMsg) => {
    status = msg.content.status;
  };
  await future.done;
  assert(status !== undefined);
  return { status, outputs };
}

/**
 * Evaluate an expression string in the given kernel, returning the singular result.
 *
 * @param kernel connection to an active kernel
 * @param code code to execute
 */
async function evaluateExpression(kernel: Kernel.IKernelConnection, expr: string) {
  // TODO: batch user expressions by cell?
  const future = kernel.requestExecute({
    code: '',
    user_expressions: {
      expr: expr,
    },
  });
  let result: IExpressionResult | undefined;
  future.onReply = (msg: KernelMessage.IExecuteReplyMsg) => {
    switch (msg.content.status) {
      case 'ok':
        // Pull out expr
        result = (msg.content.user_expressions as unknown as Record<string, IExpressionResult>)[
          'expr'
        ];
        break;
      case 'error':
        assert(false); // We shouldn't hit this, because we don't evaluate expressions AND code simultaneously.
        break;
      default:
        break;
    }
  };
  await future.done;
  // It doesn't make sense for this to be undefined instead of an error
  assert(result !== undefined);
  return { status: result.status, result };
}

/**
 * Build a cache key from an array of executable nodes
 *
 * @param nodes array of executable ndoes
 */
function buildCacheKey(nodes: (ICellBlock | InlineExpression)[]): string {
  // Build an array of hashable items from an array of nodes
  const hashableItems: {
    kind: string;
    content: string;
  }[] = [];
  for (const node of nodes) {
    if (isCellBlock(node)) {
      hashableItems.push({
        kind: node.type,
        content: (select('code', node) as Code).value,
      });
    } else {
      assert(isInlineExpression(node));
      hashableItems.push({
        kind: node.type,
        content: node.value,
      });
    }
  }
  // Serialise the array into JSON, and compute the hash
  const hashableString = JSON.stringify(hashableItems);
  return createHash('md5').update(hashableString).digest('hex');
}

type ICellBlockOutput = GenericNode & {
  data: IOutput[];
};

type ICellBlock = GenericNode & {
  children: (Code | ICellBlockOutput)[];
};

/**
 * Return true if the given node is a block over a code node and output node
 *
 * @param node node to test
 */
function isCellBlock(node: GenericNode): node is ICellBlock {
  return node.type === 'block' && select('code', node) !== null && select('output', node) !== null;
}

/**
 * Return true if the given node is an inlineExpression node
 *
 * @param node node to test
 */
function isInlineExpression(node: GenericNode): node is InlineExpression {
  return node.type === 'inlineExpression';
}

/**
 * For each executable node, perform a kernel execution request and return the results.
 * Return an additional boolean indicating whether an error occured.
 *
 * @param kernel
 * @param nodes
 * @param vfile
 */
async function computeExecutableNodes(
  kernel: Kernel.IKernelConnection,
  nodes: (ICellBlock | InlineExpression)[],
  vfile: VFile,
): Promise<{
  results: (IOutput[] | IExpressionResult)[];
  errorOccurred: boolean;
}> {
  let errorOccurred = false;

  const results: (IOutput[] | IExpressionResult)[] = [];
  for (const matchedNode of nodes) {
    if (isCellBlock(matchedNode)) {
      // Pull out code to execute
      const code = select('code', matchedNode) as Code;
      const { status, outputs } = await executeCode(kernel, code.value);
      // Cache result
      results.push(outputs);

      // Check for errors
      const metadata = matchedNode.data || {};
      const allowErrors = !!metadata?.tags?.['raises-exception'];
      if (status === 'error' && !allowErrors) {
        fileWarn(vfile, 'An exception occurred during code execution, halting further execution');
        // Make a note of the failure
        errorOccurred = true;
        break;
      }
    } else if (isInlineExpression(matchedNode)) {
      // Directly evaluate the expression
      const { status, result } = await evaluateExpression(kernel, matchedNode.value);

      // Check for errors
      if (status === 'error') {
        fileWarn(
          vfile,
          'An exception occurred during expression evaluation, halting further execution',
        );
        // Make a note of the failure
        errorOccurred = true;
        break;
      }
      // Cache result
      results.push(result);
    } else {
      assert(false);
    }
  }
  return { results, errorOccurred };
}

/**
 * Apply computed outputs (MIME bundles, stdout, etc.) to MDAST.
 * If an unanticipated error occurred during execution, the length of
 * `computedResult` may not correspond to that of `nodes` (it may be shorter)
 *
 * @param nodes executable MDAST nodes
 * @param computedResult computed results for each node
 */
function applyComputedOutputsToNodes(
  nodes: (ICellBlock | InlineExpression)[],
  computedResult: (IOutput[] | IExpressionResult)[],
) {
  for (const matchedNode of nodes) {
    // Pull out the result for this node
    const thisResult = computedResult.shift();

    if (isCellBlock(matchedNode)) {
      // Pull out output to set data
      const output = select('output', matchedNode) as unknown as { data: IOutput[] };
      // Set the output array to empty if we don't have a result (e.g. due to a kernel error)
      output.data = thisResult === undefined ? [] : (thisResult as IOutput[]);
    } else if (isInlineExpression(matchedNode)) {
      // Set data of expression to the result, or empty if we don't have one
      matchedNode.result = // TODO: FIXME .data
        thisResult === undefined ? undefined : (thisResult as unknown as Record<string, unknown>);
    } else {
      // This should never happen
      throw new Error('Node must be either code block or inline expression.');
    }
  }
}

export type Options = {
  cache: ICache<(IExpressionResult | IOutput[])[]>;
  sessionFactory: () => Promise<SessionManager | undefined>;
  frontmatter: PageFrontmatter;
  ignoreCache?: boolean;
  errorIsFatal?: boolean;
};

/**
 * Transform an AST to include the outputs of executing the given notebook
 *
 * @param tree
 * @param file
 * @param opts
 */
export async function kernelExecutionTransform(tree: GenericParent, file: VFile, opts: Options) {
  // Pull out code-like nodes
  const executableNodes = selectAll(
    'block:has(code[executable=true]):has(output),inlineExpression',
    tree,
  ) as (ICellBlock | InlineExpression)[];

  // Only do something if we have any nodes!
  if (executableNodes.length === 0) {
    return;
  }

  // See if we already cached this execution
  const cacheKey = buildCacheKey(executableNodes);
  let cachedResults: (IExpressionResult | IOutput[])[] | undefined = opts.cache.get(cacheKey);

  // Do we need to re-execute notebook?
  if (opts.ignoreCache || cachedResults === undefined) {
    fileInfo(
      file,
      opts.ignoreCache
        ? 'Code cells and expressions will be re-evaluated, as the cache is being ignored'
        : 'Code cells and expressions will be re-evaluated, as there is no entry in the execution cache',
    );
    const sessionManager = await opts.sessionFactory();
    // Do we not have a working session?
    if (sessionManager === undefined) {
      fileError(file, `Could not load Jupyter session manager to run executable nodes`, {
        fatal: opts.errorIsFatal,
      });
    }
    // Otherwise, boot up a kernel, and execute each cell
    else {
      let sessionConnection: Session.ISessionConnection | undefined;
      const sessionOpts = {
        path: file.path,
        type: 'notebook',
        name: path.basename(file.path),
        kernel: {
          name: opts.frontmatter?.kernelspec?.name ?? 'python3',
        },
      };
      await sessionManager
        .startNew(sessionOpts)
        .then(async (conn) => {
          sessionConnection = conn;
          assert(conn.kernel);
          fileInfo(file, `Connected to kernel ${conn.kernel.name}`);
          // Execute notebook
          const { results, errorOccurred } = await computeExecutableNodes(
            conn.kernel,
            executableNodes,
            file,
          );
          // Populate cache if things were successful
          if (!errorOccurred) {
            opts.cache.set(cacheKey, results);
          } else {
            // Otherwise, keep tabs on the error
            fileError(file, 'An error occurred during kernel execution', {
              fatal: opts.errorIsFatal,
            });
          }
          // Refer to these computed results
          cachedResults = results;
        })
        // Ensure that we shut-down the kernel
        .finally(async () => sessionConnection !== undefined && sessionConnection.shutdown());
    }
  }

  if (cachedResults) {
    // Apply results to tree
    applyComputedOutputsToNodes(executableNodes, cachedResults);
  }
}

export const kernelExecutionPlugin: Plugin<[Options], GenericParent, GenericParent> =
  (opts) => async (tree, file) => {
    await kernelExecutionTransform(tree, file, opts);
  };
