import { Output } from '../blocks/output';
import { CodeCell, CELL_TYPE } from './types';
import { Code } from '../blocks/code';
import { Language, KINDS, TARGET, CodeFormatTypes } from '../blocks/types';
import { ensureString } from '../helpers';
import { fromJupyter as outputDataFromJuyter } from './outputData';

export function toJupyter(block: Code): CodeCell {
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
): (Code | Output)[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // preserve any metadata we don't know about
  const { iooxa, ...jupyter } = jupyterCell.metadata;

  const block: Code = {
    kind: KINDS.Code,
    content: ensureString(jupyterCell.source) ?? '',
    targets: [TARGET.JupyterCode],
    format: CodeFormatTypes.txt,
    language: language ?? '',
    metadata: {
      jupyter,
    },
    execution_count: jupyterCell.execution_count,
  } as Code;

  if (jupyterCell.outputs) {
    return [block, outputDataFromJuyter(jupyterCell.outputs) as Output];
  }

  return [block];
}
