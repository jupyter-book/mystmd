/* eslint-disable quotes */
import { CellOutputMimeTypes, CellOutputType, DisplayData, ensureString } from '@curvenote/blocks';
import { makeCellOutput } from './helpers';
import { processMultiMimeOutputs } from '../src/summarize/multimime';
import { StubFileObject } from '../src/files';

describe('summarize.multimime', () => {
  test.each([
    ['traceback', CellOutputType.Traceback, CellOutputMimeTypes.TextPlain],
    ['stream', CellOutputType.Stream, CellOutputMimeTypes.TextPlain],
    ['text/plain', CellOutputType.DisplayData, CellOutputMimeTypes.TextPlain],
    ['text/html', CellOutputType.DisplayData, CellOutputMimeTypes.TextHtml],
    ['image/svg', CellOutputType.DisplayData, CellOutputMimeTypes.ImageSvg],
  ])('no-op for %s', async (s, output_type, content_type) => {
    const item = makeCellOutput(output_type, content_type, 'something');

    const items = processMultiMimeOutputs((path: string) => new StubFileObject(path), [item]);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(item);
    if (items[0].output_type === CellOutputType.DisplayData) {
      expect((items[0] as DisplayData).data).toHaveProperty(content_type);
    }
  });
  describe('plotly', () => {
    const plotlyJson = makeCellOutput(
      CellOutputType.DisplayData,
      CellOutputMimeTypes.AppPlotly,
      '{"plotly":"json"}',
    ) as DisplayData;

    const script =
      ensureString([
        '<script type="text/javascript"> ',
        " window.PlotlyConfig = {MathJaxConfig: 'local'}; ",
        ' if (window.MathJax) {MathJax.Hub.Config({SVG: {font: "STIX-Web"}});} ',
        " if (typeof require !== 'undefined') { ",
        ' require.undef("plotly"); ',
        " define('plotly', function(require, exports, module) { ",
        ' /** ',
        '* plotly.js v1.55.2 ',
        '* Copyright 2012-2020, Plotly, Inc. ',
        '* All rights reserved. ',
        '* Licensed under the MIT license ',
        '*/ ',
      ]) + 'x'.repeat(10000);

    const plotlyScript = makeCellOutput(
      CellOutputType.DisplayData,
      CellOutputMimeTypes.TextHtml,
      script,
    ) as DisplayData;

    const otherHtml = makeCellOutput(
      CellOutputType.DisplayData,
      CellOutputMimeTypes.TextHtml,
      '<p>not plotly</p>',
    ) as DisplayData;
    test.each([
      ['1', [plotlyJson, plotlyScript, otherHtml]],
      ['2', [otherHtml, plotlyJson, plotlyScript]],
      ['3', [otherHtml, plotlyScript, plotlyJson]],
      ['4', [plotlyJson, otherHtml, plotlyScript]],
    ])('order %s', (s, original) => {
      const items = processMultiMimeOutputs((path: string) => new StubFileObject(path), original);

      expect(items).toHaveLength(2);
      const keys = items
        .map((i) => Object.keys((i as DisplayData).data))
        .reduce((list, i) => [...list, ...i], []);
      expect(keys).toContain(CellOutputMimeTypes.AppPlotly);
      expect(keys).toContain(CellOutputMimeTypes.TextHtml);
    });
  });
});
