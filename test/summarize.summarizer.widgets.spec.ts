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

describe('database.versions.output.summarize.widgets', () => {
  let summarizer: Summarizer | null;
  beforeEach(() => {
    const output = makeCellOutput(
      CellOutputType.ExecuteResult,
      CellOutputMimeTypes.AppWidgetView as CellOutputMimeTypes,
      { nested: { json: 'object' } },
    ) as ExecuteResult;
    output.data[CellOutputMimeTypes.TextHtml] = '<div id="1234567890asdfghjkl" />';
    summarizer = Summarizer.new(
      (path: string) => new StubFileObject(path),
      OutputSummaryKind.ipywidgets,
      output,
      'storage/path',
    ) as Summarizer;
  });
  test('instance kind', () => {
    expect(summarizer?.kind()).toEqual(OutputSummaryKind.ipywidgets);
  });
  test.each([
    [false, CellOutputType.DisplayData, 'image/png'],
    [false, CellOutputType.Stream, 'text/plain'],
    [true, CellOutputType.DisplayData, CellOutputMimeTypes.AppWidgetView],
  ])('test %s', (result, output_type, mimetype) => {
    expect(
      summarizer?.test(makeCellOutput(output_type, mimetype as CellOutputMimeTypes) as DisplayData),
    ).toBe(result);
  });
  test('next - strips nothing', async () => {
    const next = summarizer?.next() as DisplayData;
    expect(Object.keys(next.data)).toHaveLength(1);
  });
  test('prepare', () => {
    const dboEntry = summarizer?.prepare();
    expect(dboEntry).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.ipywidgets,
        content_type: CellOutputMimeTypes.AppWidgetView,
        content: '{"nested":{"json":"object"}}',
      }),
    );
  });
});
