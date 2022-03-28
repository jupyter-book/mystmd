import { OutputSummaryEntry } from '@curvenote/blocks';
import { OutputSummaries } from '@curvenote/nbtx';
import { GenericNode, selectAll } from 'mystjs';

import { Root } from './types';

export function transformOutputs(mdast: Root) {
  const outputs = selectAll('output', mdast) as GenericNode[];
  outputs.forEach((output) => {
    // Jupyter outputs are an array of multiple outputs, so here we have
    // an array of output summaries
    // eslint-disable-next-line prefer-destructuring
    const data: OutputSummaries[] = output.data;
    data.forEach((summary) => {
      Object.values(summary.items ?? {}).forEach((entry: OutputSummaryEntry) => {
        if (entry?.path) entry.path = `/${entry?.path}`;
      });
    });
  });
}
