import { selectAll } from 'unist-util-select';
import type { PageFrontmatter } from 'myst-frontmatter';
import { Kernel, KernelMessage, SessionManager } from '@jupyterlab/services';
import type { IExpressionResult } from './inlineExpressions.js';
import type { Code, InlineExpression } from 'myst-spec-ext';
import type { IOutput } from '@jupyterlab/nbformat';
import type { GenericParent } from 'myst-common';
import path from 'node:path';
import assert from 'node:assert';

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
  future.onIOPub = (msg: KernelMessage.IIOPubMessage) => {
    // Only listen for replies to this execution
    if (
      msg.parent_header.msg_id !== future.msg.header.msg_id ||
      msg.parent_header.msg_type !== 'execute_request'
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
  assert(status !== undefined);

  await future.done;
  return { status, outputs };
}

/**
 * Evaluate an expression string in the given kernel, returning the singular result.
 *
 * @param kernel connection to an active kernel
 * @param code code to execute
 */
async function executeExpression(kernel: Kernel.IKernelConnection, expr: string) {
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

type CacheKey = any;
type CacheItem = (Code | InlineExpression)[];

function buildCacheKey(mdast: (Code | InlineExpression)[]): any {
  return undefined;
}

function getCache(key: CacheKey): CacheItem | undefined {
  return undefined;
}

function setCache(key: CacheKey, value: CacheItem) {}

/**
 * Transform an AST to include the outputs of executing the given notebook
 *
 * @param sessionManager
 * @param mdast
 * @param frontmatter
 * @param filePath
 */
async function transformKernelExecution(
  sessionManager: SessionManager,
  mdast: GenericParent,
  frontmatter: PageFrontmatter,
  filePath: string,
  ignoreCache: boolean,
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
    const codeOrEvalNodes = selectAll('code[executable=true],inlineExpression', mdast) as (
      | Code
      | InlineExpression
    )[];

    // Execute notebook!
    const cacheKey = buildCacheKey(codeOrEvalNodes);
    let rehydratedNodes: (Code | InlineExpression)[] | undefined = getCache(cacheKey);
    if (ignoreCache || rehydratedNodes === undefined) {
      try {
        rehydratedNodes = []; // TODO
        for (const matchedNode of codeOrEvalNodes) {
          if (matchedNode.type === 'code') {
            const { status, outputs } = await executeCode(kernel, matchedNode.value);
            // TODO: minify output
            // (matchedNode as Code).data = ...
          } else {
            const { status, result } = await executeExpression(kernel, matchedNode.value);
            (matchedNode as InlineExpression).result = result;
            // TODO: (matchedNode as InlineExpression).children = ...
          }
        }
        // Populate cache
        setCache(cacheKey, rehydratedNodes);
      } catch {
        console.error('Execution failed');
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
  });
}
