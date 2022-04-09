import {
  KnownCellOutputMimeTypes,
  CellOutputType,
  DisplayData,
  OutputSummaryKind,
} from '@curvenote/blocks';
import { StubFileObject } from '../src';
import { Summarizer } from '../src/summarize/summarizers';
import { makeCellOutput } from './helpers';

describe('database.versions.output.summarize.image', () => {
  let summarizer: Summarizer | null;
  beforeEach(() => {
    const item = makeCellOutput(
      CellOutputType.DisplayData,
      KnownCellOutputMimeTypes.ImagePng,
      'data:uri',
    ) as DisplayData;
    item.data[KnownCellOutputMimeTypes.TextPlain] = '<matplotlib 0x1234567>';
    summarizer = Summarizer.new(
      (path: string) => new StubFileObject(path),
      OutputSummaryKind.image,
      item,
      'storage/path',
    ) as Summarizer;
  });
  test('instance kind', () => {
    expect(summarizer?.kind()).toEqual(OutputSummaryKind.image);
  });
  test.each([
    [true, CellOutputType.DisplayData, 'image/png'],
    [true, CellOutputType.DisplayData, 'image/gif'],
    [true, CellOutputType.DisplayData, 'image/bmp'],
    [true, CellOutputType.DisplayData, 'image/jpeg'],
    [false, CellOutputType.DisplayData, 'image/svg+xml'],
    [false, CellOutputType.DisplayData, 'text/plain'],
    [false, CellOutputType.Stream, 'text/plain'],
  ])('test %s', (result, output_type, mimetype) => {
    expect(
      summarizer?.test({
        output_type,
        data: {
          [mimetype]: 'datauri',
        },
        metadata: {},
      } as DisplayData),
    ).toBe(result);
  });
  test('next - strips self, text/plain', async () => {
    const next = summarizer?.next() as DisplayData;
    expect(Object.keys(next.data)).toHaveLength(0);
  });
});
