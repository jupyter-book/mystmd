import {
  KnownCellOutputMimeTypes,
  CellOutputType,
  DisplayData,
  OutputSummaryKind,
} from '@curvenote/blocks';
import { StubFileObject } from '../src';
import { Summarizer } from '../src/summarize/summarizers';
import { makeCellOutput } from './helpers';

describe('database.versions.output.summarize.text', () => {
  let summarizer: Summarizer | null;
  beforeEach(() => {
    const output = makeCellOutput(
      CellOutputType.DisplayData,
      KnownCellOutputMimeTypes.TextPlain as KnownCellOutputMimeTypes,
    ) as DisplayData;
    // summarizer = new TextSummarizer(new Context(), output, 'storage/path');
    summarizer = Summarizer.new(
      (path: string) => new StubFileObject(path),
      OutputSummaryKind.text,
      output,
      'storage/path',
    ) as Summarizer;
  });
  test('instance kind', () => {
    expect(summarizer?.kind()).toEqual(OutputSummaryKind.text);
  });
  test.each([
    [false, CellOutputType.DisplayData, 'image/png'],
    [false, CellOutputType.Stream, 'text/plain'],
    [true, CellOutputType.DisplayData, 'text/plain'],
  ])('test %s', (result, output_type, mimetype) => {
    expect(
      summarizer?.test(
        makeCellOutput(output_type, mimetype as KnownCellOutputMimeTypes) as DisplayData,
      ),
    ).toBe(result);
  });
  test('next - strips text/plain', async () => {
    const next = summarizer?.next() as DisplayData;
    expect(Object.keys(next.data)).toHaveLength(0);
  });
});
