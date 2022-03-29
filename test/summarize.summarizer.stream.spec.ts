import {
  CellOutput,
  KnownCellOutputMimeTypes,
  CellOutputType,
  DisplayData,
  OutputSummaryKind,
} from '@curvenote/blocks';
import { StubFileObject } from '../src';
import { Summarizer } from '../src/summarize/summarizers';
import StreamSummarizer from '../src/summarize/summarizers/stream';
import { makeCellOutput } from './helpers';

describe('database.versions.output.summarize.stream', () => {
  let summarizer: StreamSummarizer;
  beforeEach(() => {
    summarizer = Summarizer.new(
      (path: string) => new StubFileObject(path),
      OutputSummaryKind.stream,
      {} as CellOutput,
      'storage/path',
    ) as Summarizer;
  });
  test('instance kind', () => {
    expect(summarizer?.kind()).toEqual(OutputSummaryKind.stream);
  });
  test('next', () => {
    expect(summarizer?.next()).toEqual({});
  });
  test.each([
    [false, CellOutputType.DisplayData, 'image/png'],
    [false, CellOutputType.DisplayData, 'text/plain'],
    [false, CellOutputType.Traceback, 'text/plain'],
    [true, CellOutputType.Stream, 'text/plain'],
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
