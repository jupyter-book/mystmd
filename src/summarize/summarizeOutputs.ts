import { CellOutput, CellOutputType, OutputSummaryKind } from '@curvenote/blocks';
import { OutputSummaries } from '../types';
import { IFileObjectFactoryFn } from '../files';
import { processMultiMimeOutputs as summarizeMultiMimeOutputs } from './multimime';
import { Summarizer } from './summarizers';
import { summarizeDisplayDataOrExecuteResult } from './display';
import { SummarizerOptions } from './summarizers/types';

/**
 * Summarize the output of a single cell, serializing to file as appropriate
 *
 * @param fileFactory
 * @param item
 * @param basepath
 * @returns
 */
export const summarizeOutput = async (
  fileFactory: IFileObjectFactoryFn,
  item: CellOutput,
  basepath: string,
  options: SummarizerOptions,
): Promise<OutputSummaries> => {
  if (item.output_type === CellOutputType.Stream || item.output_type === CellOutputType.Traceback) {
    const summaries: OutputSummaries = {
      kind: OutputSummaryKind.unknown,
      items: {},
    };
    const kind =
      item.output_type === CellOutputType.Stream
        ? OutputSummaryKind.stream
        : OutputSummaryKind.error;
    const summarizer = Summarizer.new(fileFactory, kind, item, basepath, options);
    if (summarizer != null) {
      const summary = await summarizer.process(summarizer.prepare());
      summaries.items = { ...summaries.items, [kind]: summary };
      summaries.kind = kind;
    }
    return summaries;
  }
  return summarizeDisplayDataOrExecuteResult(fileFactory, item, basepath, options);
};

/**
 * Top level output processing function. Takes array of cell outputs and returns summarised output
 * data structures along, handling serialisation and storage of outputs in file objects
 *
 * @param fileFactory
 * @param items
 * @param basepath
 * @returns
 */
export const summarizeOutputs = (
  fileFactory: IFileObjectFactoryFn,
  items: CellOutput[],
  basepath: string, // TODO move to options?
  options: SummarizerOptions = { truncate: true },
) => {
  const preprocessed = summarizeMultiMimeOutputs(fileFactory, items);

  // process remaining items
  return Promise.all(
    preprocessed.map(
      async (item, idx): Promise<OutputSummaries> =>
        summarizeOutput(fileFactory, item, `${basepath}.${idx}`, options),
    ),
  );
};
