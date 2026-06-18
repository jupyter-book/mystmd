import type { InlineExpression, CodeBlock, IExpressionResult } from 'myst-spec';
import type { IOutput } from '@jupyterlab/nbformat';

/**
 * Kinds of nodes that we can "execute"
 */
export type ExecutableNode = CodeBlock | InlineExpression;

/**
 * Interface types for serialising execution results
 */
export type CodeResult = {
  type: 'code';
  responses: IOutput[];
};

export type ExpressionResult = {
  type: 'inlineExpression';
  response: IExpressionResult;
};

export type ExecutionResult = CodeResult | ExpressionResult;

export function isCodeResult(result: ExecutionResult): result is CodeResult {
  return result.type === 'code';
}
export function isExpressionResult(result: ExecutionResult): result is ExpressionResult {
  return result.type === 'inlineExpression';
}

/**
 * Result of document execution
 */
export type DocumentExecutionResult = {
  // Additional execution metadata
  context: Record<string, any>;
  // Array of results, one for each "executable" AST node
  results: ExecutionResult[];
};
