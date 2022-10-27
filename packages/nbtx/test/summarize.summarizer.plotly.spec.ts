import {
  CellOutput,
  KnownCellOutputMimeTypes,
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
      KnownCellOutputMimeTypes.AppPlotly as KnownCellOutputMimeTypes,
      { nested: { json: 'object' } },
    ) as DisplayData;
    output.data[KnownCellOutputMimeTypes.ImagePng] = 'kjsdkjsahdsajkdh324567';
    output.data[KnownCellOutputMimeTypes.TextHtml] = '<script>all of plotly</script>';
    output.data[KnownCellOutputMimeTypes.TextPlain] = 'text output that we do not need';
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
    [false, CellOutputType.DisplayData, KnownCellOutputMimeTypes.ImagePng],
    [false, CellOutputType.Stream, KnownCellOutputMimeTypes.TextPlain],
    [false, CellOutputType.DisplayData, KnownCellOutputMimeTypes.AppJson],
    [true, CellOutputType.DisplayData, KnownCellOutputMimeTypes.AppPlotly],
  ])('test %s', (result, output_type, mimetype) => {
    expect(
      summarizer?.test(
        makeCellOutput(output_type, mimetype as KnownCellOutputMimeTypes) as DisplayData,
      ),
    ).toBe(result);
  });
  test('next - strips html', async () => {
    const next = summarizer?.next() as DisplayData;
    expect(Object.keys(next.data)).toHaveLength(1);
    expect(next.data).toEqual(
      expect.objectContaining({
        [KnownCellOutputMimeTypes.ImagePng]: 'kjsdkjsahdsajkdh324567',
      }),
    );
  });
  test('prepare', () => {
    const dboEntry = summarizer?.prepare();
    expect(dboEntry).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.plotly,
        content_type: KnownCellOutputMimeTypes.AppPlotly,
        content: '{"nested":{"json":"object"}}',
      }),
    );
  });
});
