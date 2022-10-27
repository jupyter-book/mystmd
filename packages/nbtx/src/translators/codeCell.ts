import type { Language, Blocks, CodeCell } from '@curvenote/blocks';
import { KINDS, TARGET, CodeFormatTypes, ensureString, CELL_TYPE } from '@curvenote/blocks';
import { fromJupyter as outputDataFromJuyter } from './outputData';

export function toJupyter(block: Blocks.Code): CodeCell {
  const { metadata, content, execution_count } = block;

  return {
    cell_type: CELL_TYPE.Code,
    metadata: {
      ...metadata.jupyter,
      iooxa: {
        id: block.id,
        outputId: block.output,
      },
    },
    source: content,
    execution_count,
    outputs: [],
  };
}

export function fromJupyter(
  jupyterCell: CodeCell,
  language: Language | undefined,
): (Blocks.Code | Blocks.Output)[] {
  // preserve any metadata we don't know about
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { iooxa, ...jupyter } = jupyterCell.metadata;

  const block: Blocks.Code = {
    kind: KINDS.Code,
    content: ensureString(jupyterCell.source) ?? '',
    targets: [TARGET.JupyterCode],
    format: CodeFormatTypes.txt,
    language: language ?? '',
    metadata: {
      jupyter,
    },
    execution_count: jupyterCell.execution_count,
  } as Blocks.Code;

  if (jupyterCell.outputs) {
    return [block, outputDataFromJuyter(jupyterCell.outputs) as Blocks.Output];
  }

  return [block];
}
