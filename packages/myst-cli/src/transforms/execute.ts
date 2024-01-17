import { select, selectAll } from 'unist-util-select';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { Kernel, KernelMessage, SessionManager } from '@jupyterlab/services';
import type { IExpressionResult } from './inlineExpressions.js';
import type { Code, InlineExpression } from 'myst-spec-ext';
import type { IOutput } from '@jupyterlab/nbformat';
import type { GenericNode, GenericParent } from 'myst-common';
import type { VFile } from 'vfile';
import { renderExpression } from './inlineExpressions.js';
import path from 'node:path';
import assert from 'node:assert';
import { createHash } from 'node:crypto';

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
        console.debug('Ignoring IOPub reply (unexpected message type)');
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

type CacheItem = (Code | InlineExpression)[];

type HashableCacheKeyItem = {
  kind: string;
  content: string;
};

function buildCacheKey(mdast: (ICellBlock | InlineExpression)[]): string {
  // Build an array of hashable items from an array of nodes
  const hashableItems: HashableCacheKeyItem[] = [];
  for (const node of mdast) {
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

function getCache(key: string): CacheItem | undefined {
  return undefined;
}

function setCache(key: string, value: CacheItem) {}

type ICellBlockOutput = GenericNode & {
  data: IOutput[];
};

type ICellBlock = GenericNode & {
  children: (Code | ICellBlockOutput)[];
};

function isCellBlock(node: GenericNode): node is ICellBlock {
  return node.type === 'block' && select('code', node) !== null && select('output', node) !== null;
}

function isInlineExpression(node: GenericNode): node is InlineExpression {
  return node.type === 'inlineExpression';
}

/**
 * Transform an AST to include the outputs of executing the given notebook
 *
 * @param sessionManager
 * @param mdast
 * @param frontmatter
 * @param filePath
 * @param ignoreCache
 * @param file
 */
export async function transformKernelExecution(
  sessionManager: SessionManager,
  mdast: GenericParent,
  frontmatter: PageFrontmatter,
  filePath: string,
  ignoreCache: boolean,
  file: VFile,
) {
  const options = {
    path: filePath,
    type: 'notebook',
    name: path.basename(filePath),
    kernel: {
      name: frontmatter?.kernelspec?.name ?? 'python3',
    },
  };

  // Boot up a kernel, and execute each cell
  return await sessionManager.startNew(options).then(async (conn) => {
    const kernel = conn.kernel;
    assert(kernel);
    console.log(`Connected to kernel ${kernel.name}`);

    // Pull out code-like nodes
    const codeOrEvalNodes = selectAll(
      'block:has(code[executable=true]):has(output),inlineExpression',
      mdast,
    ) as (ICellBlock | InlineExpression)[];

    // Execute notebook!
    const cacheKey = buildCacheKey(codeOrEvalNodes);
    let rehydratedNodes: (Code | InlineExpression)[] | undefined = getCache(cacheKey);
    if (ignoreCache || rehydratedNodes === undefined) {
      try {
        // TODO: in future populate this array, which will be cached,
        //       then use positional correspondence with true AST
        rehydratedNodes = [];
        for (const matchedNode of codeOrEvalNodes) {
          if (isCellBlock(matchedNode)) {
            // Pull out code to execute
            const code = select('code', matchedNode) as Code;
            const { status, outputs } = await executeCode(kernel, code.value);
            // Set result on output
            const output = select('output', matchedNode) as unknown as { data: IOutput[] };
            output.data = outputs;
          } else if (isInlineExpression(matchedNode)) {
            // Directly evaluate the expression
            const { status, result } = await evaluateExpression(kernel, matchedNode.value);
            // Set the result on the expression
            matchedNode.result = result;
            matchedNode.children = renderExpression(matchedNode, file);
          }
        }
        // Populate cache
        setCache(cacheKey, rehydratedNodes);
      } catch (e: any) {
        console.error('Execution failed', e);
        throw new Error();
      } finally {
        // Shutdown kernel
        await kernel.shutdown();
      }
    }

    // let rehydratedNodes: (Code | InlineExpression)[] | undefined;
    // if (!ignoreCache) {
    //   rehydratedNodes = getCachedExecution(codeOrEvalNodes);
    // }
    console.log('Done execution', JSON.stringify(mdast));
  });
}
