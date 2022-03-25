import {
  CellOutputMimeTypes,
  CellOutputType,
  DisplayData,
  OutputSummaryKind,
} from '@curvenote/blocks';
import { StubFileObject } from '../src';
import { Summarizer } from '../src/summarize/summarizers';
import { makeCellOutput } from './helpers';

describe('database.versions.output.summarize.latex', () => {
  let summarizer: Summarizer | null;
  beforeEach(() => {
    const output = makeCellOutput(
      CellOutputType.DisplayData,
      CellOutputMimeTypes.TextLatex as CellOutputMimeTypes,
    ) as DisplayData;
    summarizer = Summarizer.new(
      (path: string) => new StubFileObject(path),
      OutputSummaryKind.latex,
      output,
      'storage/path',
    ) as Summarizer;
  });
  test('instance kind', () => {
    expect(summarizer?.kind()).toEqual(OutputSummaryKind.latex);
  });
  test.each([
    [false, CellOutputType.DisplayData, 'image/png'],
    [false, CellOutputType.Stream, 'text/plain'],
    [true, CellOutputType.DisplayData, 'text/latex'],
  ])('test %s', (result, output_type, mimetype) => {
    expect(
      summarizer?.test(makeCellOutput(output_type, mimetype as CellOutputMimeTypes) as DisplayData),
    ).toBe(result);
  });
  test('next - strips text/latex', async () => {
    const next = summarizer?.next() as DisplayData;
    expect(Object.keys(next.data)).toHaveLength(0);
  });
});
