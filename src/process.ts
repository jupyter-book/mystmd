/* eslint-disable import/no-cycle */
import {
  CellOutput,
  CellOutputMimeTypes,
  CellOutputType,
  DisplayData,
  ExecuteResult,
  OutputSummaryKind,
  OutputSummaryEntry,
  ensureString,
} from '@curvenote/blocks';
import { OutputSummaries } from './types';
import { Summarizer, ORDER, SECOND_LEVEL_OUTPUTS } from './summarize';
import { IFileObjectFactoryFn } from './files';

const processDisplayDataOrExecuteResult = async (
  fileFactory: IFileObjectFactoryFn,
  item: CellOutput,
  basepath: string,
) => {
  const dbo: OutputSummaries = {
    kind: OutputSummaryKind.unknown,
    items: {},
  };
  const summaries: { summary: OutputSummaryEntry; summarizer: Summarizer }[] = [];
  const unprocessed = ORDER.reduce<DisplayData | ExecuteResult>(
    (output, kind) => {
      const summarizer = Summarizer.new(fileFactory, kind, output, basepath);
      if (summarizer != null && summarizer.test(output)) {
        if (dbo.kind === OutputSummaryKind.unknown) dbo.kind = kind;
        const summary = summarizer.prepare();
        summaries.push({ summary, summarizer });
        const nextItem = summarizer.next() as DisplayData | ExecuteResult;
        return nextItem;
      }
      return output;
    },
    { ...item } as DisplayData | ExecuteResult,
  );

  const entries = await Promise.all(
    summaries.map(async ({ summary, summarizer }) => {
      const dboEntry = await summarizer.process(summary);
      return [summary.kind, dboEntry];
    }),
  );

  dbo.items = Object.fromEntries(entries);

  // there may be remaining unprocessed keys/entries? do something with them?
  if (Object.keys((unprocessed as DisplayData | ExecuteResult)?.data ?? {}).length > 0) {
    dbo.items = {
      ...dbo.items,
      [OutputSummaryKind.unknown]: {
        kind: OutputSummaryKind.unknown,
        content_type: CellOutputMimeTypes.TextPlain,
        content: Object.keys((unprocessed as DisplayData | ExecuteResult)?.data ?? {}).join(', '),
      },
    };
  }

  return dbo;
};

export const processItem = async (
  fileFactory: IFileObjectFactoryFn,
  item: CellOutput,
  basepath: string,
): Promise<OutputSummaries> => {
  if (item.output_type === CellOutputType.Stream || item.output_type === CellOutputType.Traceback) {
    const dbo: OutputSummaries = {
      kind: OutputSummaryKind.unknown,
      items: {},
    };
    const kind =
      item.output_type === CellOutputType.Stream
        ? OutputSummaryKind.stream
        : OutputSummaryKind.error;
    const summarizer = Summarizer.new(fileFactory, kind, item, basepath);
    if (summarizer != null) {
      const dboEntry = await summarizer.process(summarizer.prepare());
      dbo.items = { ...dbo.items, [kind]: dboEntry };
      dbo.kind = kind;
    }
    return dbo;
  }
  return processDisplayDataOrExecuteResult(fileFactory, item, basepath);
};

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

export const processSecondLevelOutputs = (
  fileFactory: IFileObjectFactoryFn,
  items: CellOutput[],
  basepath: string,
) => {
  let preprocessed = [...items];

  // filter output items based on second level outputs
  SECOND_LEVEL_OUTPUTS.forEach((kind) => {
    const needsPreprocessing: boolean = preprocessed.some((item) => {
      if (
        item.output_type === CellOutputType.Stream ||
        item.output_type === CellOutputType.Traceback
      )
        return false;
      const summarizer = Summarizer.new(fileFactory, kind, item, '');
      return summarizer?.test(item) ?? false;
    });

    if (needsPreprocessing) {
      switch (kind) {
        case OutputSummaryKind.plotly: {
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
          break;
        }
      }
    }
  });
  return preprocessed;
};

export const process = (
  fileFactory: IFileObjectFactoryFn,
  items: CellOutput[],
  basepath: string,
) => {
  const preprocessed = processSecondLevelOutputs(fileFactory, items, basepath);

  // process remaining items
  return Promise.all(
    preprocessed.map(
      async (item, idx): Promise<OutputSummaries> =>
        processItem(fileFactory, item, `${basepath}.${idx}`),
    ),
  );
};
