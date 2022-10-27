import type { Blocks, CellOutput } from '@curvenote/blocks';
import { KINDS, OutputFormatTypes, TARGET } from '@curvenote/blocks';

/**
 * Translate an output block to a jupyter CellOutput array
 *
 * @param block a version with the content field resolved to the output data
 */
export function toJupyter(block: Blocks.Output): CellOutput[] {
  return (block.original ?? []) as CellOutput[];
}

/*
  Conversion from Jupyter Output Data Structures.
  Callers should filter blocks to supported before calling
*/
export function fromJupyter(outputs: CellOutput[]): Partial<Blocks.Output> {
  return {
    kind: KINDS.Output,
    targets: [TARGET.JupyterOutput],
    format: OutputFormatTypes.jupyter,
    original: outputs,
  };
}
