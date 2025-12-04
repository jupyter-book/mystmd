import type { KernelSpec } from 'myst-frontmatter';
import type { Kernel, KernelMessage, SessionManager } from '@jupyterlab/services';
import type { IOutput } from '@jupyterlab/nbformat';
import type { IExpressionResult } from 'myst-common';
import type { VFile } from 'vfile';
import path from 'node:path';
import assert from 'node:assert';

type ISessionConnection = Awaited<ReturnType<SessionManager['startNew']>>;
type ISessionConnectionWithKernel = ISessionConnection & {
  kernel: NonNullable<ISessionConnection['kernel']>;
};

export async function createKernelConnection(
  sessionManager: SessionManager,
  basePath: string,
  kernelspec: KernelSpec,
  vfile: VFile,
): Promise<ISessionConnectionWithKernel | undefined> {
  const sessionOpts = {
    type: 'notebook',
    path: path.relative(basePath, vfile.path),
    name: path.basename(vfile.path),
    kernel: {
      name: kernelspec.name,
    },
  };
  const connection = await sessionManager.startNew(sessionOpts);
  if (connection.kernel === null) {
    return undefined;
  }
  return connection as any;
}

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
export async function executeCodeCell(kernel: Kernel.IKernelConnection, code: string) {
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
export async function evaluateInlineExpression(kernel: Kernel.IKernelConnection, expr: string) {
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
    }
  };
  await future.done;
  // It doesn't make sense for this to be undefined instead of an error
  assert(result !== undefined);
  return { status: result.status, result };
}
