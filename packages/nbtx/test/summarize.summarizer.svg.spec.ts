import {
  KnownCellOutputMimeTypes,
  CellOutputType,
  DisplayData,
  OutputSummaryKind,
} from '@curvenote/blocks';
import { StubFileObject } from '../src';
import { Summarizer } from '../src/summarize/summarizers';
import SvgSummarizer from '../src/summarize/summarizers/svg';
import { makeCellOutput } from './helpers';

describe('database.versions.output.summarize.svg', () => {
  let summarizer: SvgSummarizer;
  beforeEach(() => {
    const output = makeCellOutput(
      CellOutputType.DisplayData,
      KnownCellOutputMimeTypes.ImageSvg as KnownCellOutputMimeTypes,
    ) as DisplayData;
    summarizer = Summarizer.new(
      (path: string) => new StubFileObject(path),
      OutputSummaryKind.svg,
      output,
      'storage/path',
    ) as Summarizer;
  });
  test('instance kind', () => {
    expect(summarizer?.kind()).toEqual(OutputSummaryKind.svg);
  });
  test.each([
    [false, CellOutputType.DisplayData, 'image/png'],
    [false, CellOutputType.DisplayData, 'text/plain'],
    [false, CellOutputType.Stream, 'text/plain'],
    [true, CellOutputType.DisplayData, 'image/svg+xml'],
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
  test('next - strips image/svg', async () => {
    const next = summarizer?.next() as DisplayData;
    expect(Object.keys(next.data)).toHaveLength(0);
  });
});
