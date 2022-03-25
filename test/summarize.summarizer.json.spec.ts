import {
  CellOutputMimeTypes,
  CellOutputType,
  DisplayData,
  ExecuteResult,
  OutputSummaryKind,
} from '@curvenote/blocks';
import { StubFileObject } from '../src';
import { Summarizer } from '../src/summarize/summarizers';
import { makeCellOutput } from './helpers';

describe('database.versions.output.summarize.json', () => {
  let summarizer: Summarizer | null;
  beforeEach(() => {
    const output = makeCellOutput(
      CellOutputType.ExecuteResult,
      CellOutputMimeTypes.AppJson as CellOutputMimeTypes,
      { nested: { json: 'object' } },
    ) as ExecuteResult;
    output.data[CellOutputMimeTypes.TextPlain] = '<unwanted text 0x123456789>';
    summarizer = Summarizer.new(
      (path: string) => new StubFileObject(path),
      OutputSummaryKind.json,
      output,
      'storage/path',
    ) as Summarizer;
  });
  test('instance kind', () => {
    expect(summarizer?.kind()).toEqual(OutputSummaryKind.json);
  });
  test.each([
    [false, CellOutputType.DisplayData, 'image/png'],
    [false, CellOutputType.Stream, 'text/plain'],
    [true, CellOutputType.DisplayData, 'application/json'],
  ])('test %s', (result, output_type, mimetype) => {
    expect(
      summarizer?.test(makeCellOutput(output_type, mimetype as CellOutputMimeTypes) as DisplayData),
    ).toBe(result);
  });
  test('next - strips html', async () => {
    const next = summarizer?.next() as DisplayData;
    expect(Object.keys(next.data)).toHaveLength(0);
  });
  test('prepare', () => {
    const dboEntry = summarizer?.prepare();
    expect(dboEntry).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.json,
        content_type: CellOutputMimeTypes.AppJson,
        content: '{"nested":{"json":"object"}}',
      }),
    );
  });
});
