import {
  CellOutput,
  CellOutputMimeTypes,
  CellOutputType,
  DisplayData,
  ensureString,
  ExecuteResult,
  OutputSummaryKind,
} from '@curvenote/blocks';
import { IFileObjectFactoryFn } from '../files';
import { MULTI_MIME_OUTPUTS, Summarizer } from './summarizers';

function looksLikePlotlyJsScript(content: string) {
  const isBig = content.length > 10000;
  const snippet = content.slice(0, 2000).trimStart();
  const definesPlotly = snippet.match(/define\('plotly/) != null;
  const isScript = snippet.match(/^<script/) != null;
  return isBig && isScript && definesPlotly;
}

function hasNoData(item: CellOutput) {
  return (
    item.output_type === CellOutputType.Stream || item.output_type === CellOutputType.Traceback
  );
}

export const processMultiMimeOutputs = (fileFactory: IFileObjectFactoryFn, items: CellOutput[]) => {
  let preprocessed = [...items];

  // filter output items based on second level outputs
  MULTI_MIME_OUTPUTS.forEach((kind) => {
    const needsPreprocessing: boolean = preprocessed.some((item) => {
      if (
        item.output_type === CellOutputType.Stream ||
        item.output_type === CellOutputType.Traceback
      )
        return false;
      const summarizer = Summarizer.new(fileFactory, kind, item, '');
      return summarizer?.test(item) ?? false;
    });

    if (needsPreprocessing && kind === OutputSummaryKind.plotly) {
      // plotly - fine the plotly javascript if it exists and strip it
      const idx = preprocessed.findIndex((item) => {
        if (hasNoData(item)) return false;

        const { data } = item as DisplayData | ExecuteResult;
        return (
          Object.keys(data).includes(CellOutputMimeTypes.TextHtml) &&
          looksLikePlotlyJsScript(
            ensureString(data[CellOutputMimeTypes.TextHtml] as string | string[]),
          )
        );
      });
      if (idx > -1) {
        preprocessed = [...preprocessed.slice(0, idx), ...preprocessed.slice(idx + 1)];
      }
    }
  });
  return preprocessed;
};
