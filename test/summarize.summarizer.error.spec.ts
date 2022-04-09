import {
  KnownCellOutputMimeTypes,
  CellOutputType,
  DisplayData,
  OutputSummaryKind,
  Traceback,
} from '@curvenote/blocks';
import { StubFileObject } from '../src';
import { Summarizer } from '../src/summarize/summarizers';
import { makeCellOutput } from './helpers';
import ErrorSummarizer from '../src/summarize/summarizers/error';

describe('database.versions.output.summarize.error', () => {
  let summarizer: ErrorSummarizer;
  beforeEach(() => {
    const output = makeCellOutput(
      CellOutputType.Traceback,
      KnownCellOutputMimeTypes.TextPlain as KnownCellOutputMimeTypes,
    ) as Traceback;
    summarizer = Summarizer.new(
      (path: string) => new StubFileObject(path),
      OutputSummaryKind.error,
      output,
      'storage/path',
    ) as ErrorSummarizer;
  });
  test('instance kind', () => {
    expect(summarizer?.kind()).toEqual(OutputSummaryKind.error);
  });
  test('next', () => {
    expect(summarizer?.next()).toEqual({});
  });
  test.each([
    [false, CellOutputType.DisplayData, 'image/png'],
    [false, CellOutputType.Stream, 'text/plain'],
    [true, CellOutputType.Traceback, 'text/plain'],
  ])('test %s', (result, output_type, mimetype) => {
    expect(
      summarizer?.test(
        makeCellOutput(output_type, mimetype as KnownCellOutputMimeTypes) as DisplayData,
      ),
    ).toBe(result);
  });
  test('next - returns null', async () => {
    expect(summarizer?.next()).toEqual({});
  });
});
