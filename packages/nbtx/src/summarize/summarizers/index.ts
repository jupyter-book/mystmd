/* eslint-disable import/no-cycle */
import type { CellOutput } from '@curvenote/blocks';
import { KnownCellOutputMimeTypes, OutputSummaryKind } from '@curvenote/blocks';
import ErrorSummarizer from './error';
import ImageSummarizer from './image';
import SvgSummarizer from './svg';
import StreamSummarizer from './stream';
import Summarizer from './base';
import StringDisplayDataSummarizer from './stringDisplayData';
import JsonDisplayDataSummarizer from './jsonDisplayData';
import type { IFileObjectFactoryFn } from '../../files';
import type { SummarizerOptions } from './types';

Summarizer.new = (
  fileFactory: IFileObjectFactoryFn,
  kind: OutputSummaryKind,
  item: CellOutput,
  basepath: string,
  options?: SummarizerOptions,
): Summarizer | null => {
  switch (kind) {
    case OutputSummaryKind.bokeh:
      return new JsonDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.bokeh,
        KnownCellOutputMimeTypes.AppBokehExec,
        [],
        options,
      );

    case OutputSummaryKind.ipywidgets:
      return new JsonDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.ipywidgets,
        KnownCellOutputMimeTypes.AppWidgetView,
        [],
        options,
      );

    case OutputSummaryKind.plotly:
      return new JsonDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.plotly,
        KnownCellOutputMimeTypes.AppPlotly,
        [KnownCellOutputMimeTypes.TextHtml, KnownCellOutputMimeTypes.TextPlain],
        options,
      );

    case OutputSummaryKind.javascript:
      return new StringDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.javascript,
        KnownCellOutputMimeTypes.AppJavascript,
        [KnownCellOutputMimeTypes.TextPlain],
        options,
      );

    case OutputSummaryKind.json:
      return new JsonDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.json,
        KnownCellOutputMimeTypes.AppJson,
        [KnownCellOutputMimeTypes.TextPlain],
        options,
      );

    case OutputSummaryKind.latex:
      return new StringDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.latex,
        KnownCellOutputMimeTypes.TextLatex,
        [],
        options,
      );

    case OutputSummaryKind.image:
      return new ImageSummarizer(fileFactory, item, basepath);

    case OutputSummaryKind.svg:
      return new SvgSummarizer(fileFactory, item, basepath);

    case OutputSummaryKind.html:
      return new StringDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.html,
        KnownCellOutputMimeTypes.TextHtml,
        [],
        options,
      );

    case OutputSummaryKind.text:
      return new StringDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.text,
        KnownCellOutputMimeTypes.TextPlain,
        [],
        options,
      );

    case OutputSummaryKind.error:
      return new ErrorSummarizer(fileFactory, item, basepath, options);

    case OutputSummaryKind.stream:
      return new StreamSummarizer(fileFactory, item, basepath, options);

    default:
      return null;
  }
};

const MULTI_MIME_OUTPUTS: OutputSummaryKind[] = [
  OutputSummaryKind.plotly,
  // OutputSummaryKind.bokeh,
];

const ORDER: OutputSummaryKind[] = [
  OutputSummaryKind.bokeh,
  OutputSummaryKind.ipywidgets,
  OutputSummaryKind.plotly,
  OutputSummaryKind.javascript,
  OutputSummaryKind.json,
  OutputSummaryKind.latex,
  OutputSummaryKind.image,
  OutputSummaryKind.svg,
  OutputSummaryKind.html,
  OutputSummaryKind.text,
  OutputSummaryKind.error,
];

export { Summarizer, ORDER, MULTI_MIME_OUTPUTS };
