import { CellOutput } from './types';
import { Output } from '../blocks/output';
import { KINDS, TARGET, OutputFormatTypes } from '../blocks';

/**
 * Translate an output block to a jupyter CellOutput array
 *
 * @param block a version with the content field resolved to the output data
 */
export function toJupyter(block: Output): CellOutput[] {
  return (block.original ?? []) as CellOutput[];
}

/*
  Conversion from Jupyter Output Data Structures.
  Callers should filter blocks to supported before calling
*/
export function fromJupyter(outputs: CellOutput[]): Partial<Output> {
  return {
    kind: KINDS.Output,
    targets: [TARGET.JupyterOutput],
    format: OutputFormatTypes.jupyter,
    original: outputs,
  };
}
