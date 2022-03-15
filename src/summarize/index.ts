/* eslint-disable import/no-cycle */
import { CellOutput, CellOutputMimeTypes, OutputSummaryKind } from '@curvenote/blocks';
import ErrorSummarizer from './error';
import ImageSummarizer from './image';
import SvgSummarizer from './svg';
import StreamSummarizer from './stream';
import Summarizer from './base';
import StringDisplayDataSummarizer from './stringDisplayData';
import JsonDisplayDataSummarizer from './jsonDisplayData';
import { IFileObjectFactoryFn } from '../files';

Summarizer.new = (
  fileFactory: IFileObjectFactoryFn,
  kind: OutputSummaryKind,
  item: CellOutput,
  basepath: string,
): Summarizer | null => {
  switch (kind) {
    case OutputSummaryKind.bokeh:
      return new JsonDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.bokeh,
        CellOutputMimeTypes.AppBokehExec,
        [],
      );

    case OutputSummaryKind.ipywidgets:
      return new JsonDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.ipywidgets,
        CellOutputMimeTypes.AppWidgetView,
        [],
      );

    case OutputSummaryKind.plotly:
      return new JsonDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.plotly,
        CellOutputMimeTypes.AppPlotly,
        [CellOutputMimeTypes.TextHtml, CellOutputMimeTypes.TextPlain],
      );

    case OutputSummaryKind.javascript:
      return new StringDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.javascript,
        CellOutputMimeTypes.AppJavascript,
        [CellOutputMimeTypes.TextPlain],
      );

    case OutputSummaryKind.json:
      return new JsonDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.json,
        CellOutputMimeTypes.AppJson,
        [CellOutputMimeTypes.TextPlain],
      );

    case OutputSummaryKind.latex:
      return new StringDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.latex,
        CellOutputMimeTypes.TextLatex,
        [],
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
        CellOutputMimeTypes.TextHtml,
        [],
      );

    case OutputSummaryKind.text:
      return new StringDisplayDataSummarizer(
        fileFactory,
        item,
        basepath,
        OutputSummaryKind.text,
        CellOutputMimeTypes.TextPlain,
        [],
      );

    case OutputSummaryKind.error:
      return new ErrorSummarizer(fileFactory, item, basepath);

    case OutputSummaryKind.stream:
      return new StreamSummarizer(fileFactory, item, basepath);

    default:
      return null;
  }
};

const SECOND_LEVEL_OUTPUTS: OutputSummaryKind[] = [
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

export { Summarizer, ORDER, SECOND_LEVEL_OUTPUTS };
