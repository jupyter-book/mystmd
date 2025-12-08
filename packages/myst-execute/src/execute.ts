import { select, selectAll } from 'unist-util-select';
import type { Kernel } from '@jupyterlab/services';
import type { Code, InlineExpression, Outputs } from 'myst-spec-ext';
import type { IOutput } from '@jupyterlab/nbformat';
import type { GenericParent, IExpressionError } from 'myst-common';
import { NotebookCell, fileError, RuleId } from 'myst-common';
import type { VFile } from 'vfile';
import assert from 'node:assert';
import type { CodeBlock, ExecutionResult, ExecutableNode } from './types.js';
import { executeCodeCell, evaluateInlineExpression } from './kernel.js';
import {
  isCodeBlock,
  codeBlockRaisesException,
  codeBlockSkipsExecution,
  isInlineExpression,
} from './utils.js';

/**
 * For each executable node, perform a kernel execution request and return the results.
 * Return an additional boolean indicating whether an error occurred.
 *
 * @param kernel
 * @param nodes
 * @param opts
 */
export async function computeExecutableNodes(
  kernel: Kernel.IKernelConnection,
  nodes: ExecutableNode[],
  opts: { vfile: VFile },
): Promise<{
  results: ExecutionResult[];
  errorOccurred: boolean;
}> {
  let errorOccurred = false;

  const results: ExecutionResult[] = [];
  for (const matchedNode of nodes) {
    if (isCodeBlock(matchedNode)) {
      // Pull out code to execute
      const code = select('code', matchedNode) as Code;
      const { status, outputs } = await executeCodeCell(kernel, code.value);
      // Cache result
      results.push(outputs);

      // Check for errors
      const allowErrors = codeBlockRaisesException(matchedNode);
      if (status === 'error' && !allowErrors) {
        const errorMessage = outputs
          .map((item) => item.traceback)
          .flat()
          .join('\n');
        fileError(
          opts.vfile,
          `An exception occurred during code execution, halting further execution:\n\n${errorMessage}`,
          {
            node: matchedNode,
            ruleId: RuleId.codeCellExecutes,
          },
        );
        // Make a note of the failure
        errorOccurred = true;
        break;
      }
    } else if (isInlineExpression(matchedNode)) {
      // Directly evaluate the expression
      const { status, result } = await evaluateInlineExpression(kernel, matchedNode.value);

      // Check for errors
      if (status === 'error') {
        const errorMessage = (result as IExpressionError).traceback.join('\n');
        fileError(
          opts.vfile,
          `An exception occurred during expression evaluation, halting further execution:\n\n${errorMessage}`,
          { node: matchedNode, ruleId: RuleId.inlineExpressionExecutes },
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
export function applyComputedOutputsToNodes(
  nodes: ExecutableNode[],
  computedResult: ExecutionResult[],
) {
  for (const matchedNode of nodes) {
    // Pull out the result for this node
    const thisResult = computedResult.shift();

    if (isCodeBlock(matchedNode)) {
      const rawOutputData = (thisResult as IOutput[]) ?? [];
      // Pull out outputs to set data
      const outputs = select('outputs', matchedNode) as Outputs;
      // Ensure that whether this fails or succeeds, we write to `children` (e.g. due to a kernel error)
      outputs.children = rawOutputData.map((data, index) => {
        const identifier = outputs.identifier ? `${outputs.identifier}-${index}` : undefined;
        return { type: 'output', children: [], jupyter_data: data as any, identifier };
      });
    } else if (isInlineExpression(matchedNode)) {
      const rawOutputData = thisResult as Record<string, unknown> | undefined;
      // Set data of expression to the result, or empty if we don't have one
      matchedNode.result = rawOutputData;
    } else {
      // This should never happen
      throw new Error('Node must be either code block or inline expression.');
    }
  }
}

export function getExecutableNodes(tree: GenericParent) {
  // Pull out code-like nodes
  return (
    (
      selectAll(`block[kind=${NotebookCell.code}],inlineExpression`, tree) as (
        | CodeBlock
        | InlineExpression
      )[]
    )
      // Filter out nodes that skip execution
      .filter((node) => !(isCodeBlock(node) && codeBlockSkipsExecution(node)))
  );
}
