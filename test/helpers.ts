import {
  CellOutput,
  KnownCellOutputMimeTypes,
  CellOutputType,
  JsonObject,
} from '@curvenote/blocks';

export function makeCellOutput(
  output_type?: CellOutputType,
  mimetype?: KnownCellOutputMimeTypes,
  content?: JsonObject | string[] | string,
) {
  return {
    output_type: output_type ?? CellOutputType.DisplayData,
    data: {
      [mimetype ?? KnownCellOutputMimeTypes.TextPlain]: content ?? 'hello world',
    },
    metadata: {},
  } as CellOutput;
}
