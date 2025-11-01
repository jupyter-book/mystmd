import type { Block, Code, Output } from 'myst-spec-ext';
import type { IOutput } from '@jupyterlab/nbformat';

/**
 * Type narrowing Output to contain IOutput data
 *
 * TODO: lift this to the myst-spec definition
 */
export type CodeBlockOutput = Output & {
  data: IOutput[];
};

/**
 * Type narrowing Block to contain code-cells and code-cell outputs
 *
 * TODO: lift this to the myst-spec definition
 */

export type CodeBlock = Block & {
  kind: 'code';
  data?: {
    tags?: string[];
  };
  children: (Code | CodeBlockOutput)[];
};
