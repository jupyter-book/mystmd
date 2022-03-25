import {
  CellOutput,
  CellOutputMimeTypes,
  CellOutputType,
  DisplayData,
  OutputSummaryKind,
} from '@curvenote/blocks';
import { StubFileObject } from '../src';
import { Summarizer } from '../src/summarize/summarizers';
import { makeCellOutput } from './helpers';

describe('database.versions.outuput.summarize.plotly', () => {
  let summarizer: Summarizer | null;
  beforeEach(() => {
    const output = makeCellOutput(
      CellOutputType.DisplayData,
      CellOutputMimeTypes.AppPlotly as CellOutputMimeTypes,
      { nested: { json: 'object' } },
    ) as DisplayData;
    output.data[CellOutputMimeTypes.ImagePng] = 'kjsdkjsahdsajkdh324567';
    output.data[CellOutputMimeTypes.TextHtml] = '<script>all of plotly</script>';
    output.data[CellOutputMimeTypes.TextPlain] = 'text output that we do not need';
    summarizer = Summarizer.new(
      (path: string) => new StubFileObject(path),
      OutputSummaryKind.plotly,
      output as CellOutput,
      'storage/path',
    );
  });
  test('instance kind', () => {
    expect(summarizer?.kind()).toEqual(OutputSummaryKind.plotly);
  });
  test.each([
    [false, CellOutputType.DisplayData, CellOutputMimeTypes.ImagePng],
    [false, CellOutputType.Stream, CellOutputMimeTypes.TextPlain],
    [false, CellOutputType.DisplayData, CellOutputMimeTypes.AppJson],
    [true, CellOutputType.DisplayData, CellOutputMimeTypes.AppPlotly],
  ])('test %s', (result, output_type, mimetype) => {
    expect(
      summarizer?.test(makeCellOutput(output_type, mimetype as CellOutputMimeTypes) as DisplayData),
    ).toBe(result);
  });
  test('next - strips html', async () => {
    const next = summarizer?.next() as DisplayData;
    expect(Object.keys(next.data)).toHaveLength(1);
    expect(next.data).toEqual(
      expect.objectContaining({
        [CellOutputMimeTypes.ImagePng]: 'kjsdkjsahdsajkdh324567',
      }),
    );
  });
  test('prepare', () => {
    const dboEntry = summarizer?.prepare();
    expect(dboEntry).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.plotly,
        content_type: CellOutputMimeTypes.AppPlotly,
        content: '{"nested":{"json":"object"}}',
      }),
    );
  });
});
