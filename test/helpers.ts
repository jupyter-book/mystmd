import { CellOutput, CellOutputMimeTypes, CellOutputType, JsonObject } from '@curvenote/blocks';

export function makeCellOutput(
  output_type?: CellOutputType,
  mimetype?: CellOutputMimeTypes,
  content?: JsonObject | string[] | string,
) {
  return {
    output_type: output_type ?? CellOutputType.DisplayData,
    data: {
      [mimetype ?? CellOutputMimeTypes.TextPlain]: content ?? 'hello world',
    },
    metadata: {},
  } as CellOutput;
}
