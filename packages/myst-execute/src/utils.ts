import type { InlineExpression } from 'myst-spec-ext';
import type { GenericNode } from 'myst-common';
import { NotebookCell, NotebookCellTags } from 'myst-common';
import type { CodeBlock } from './types.js';
/**
 * Return true if the given node is a block over a code node and output node
 *
 * @param node node to test
 */
export function isCodeBlock(node: GenericNode): node is CodeBlock {
  return node.type === 'block' && node.kind === NotebookCell.code;
}

/**
 * Return true if the given code block is expected to raise an exception
 *
 * @param node block to test
 */
export function codeBlockRaisesException(node: CodeBlock) {
  return !!node.data?.tags?.includes?.(NotebookCellTags.raisesException);
}
/**
 * Return true if the given code block should not be executed
 *
 * @param node block to test
 */
export function codeBlockSkipsExecution(node: CodeBlock) {
  return !!node.data?.tags?.includes?.(NotebookCellTags.skipExecution);
}

/**
 * Return true if the given node is an inlineExpression node
 *
 * @param node node to test
 */
export function isInlineExpression(node: GenericNode): node is InlineExpression {
  return node.type === 'inlineExpression';
}
