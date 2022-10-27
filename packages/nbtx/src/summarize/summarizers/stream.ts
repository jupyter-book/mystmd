/* eslint-disable import/no-cycle */
import type { CellOutput, OutputSummaryEntry, Stream } from '@curvenote/blocks';
import {
  KnownCellOutputMimeTypes,
  CellOutputType,
  ensureString,
  OutputSummaryKind,
} from '@curvenote/blocks';
import Summarizer from './base';

class StreamSummarizer extends Summarizer {
  test(item: CellOutput): boolean {
    return item.output_type === CellOutputType.Stream;
  }

  kind() {
    return OutputSummaryKind.stream;
  }

  // errors are always summarized in one go
  next() {
    return {} as CellOutput;
  }

  prepare(): OutputSummaryEntry {
    const { text } = this.item as Stream;
    return {
      kind: this.kind(),
      content_type: KnownCellOutputMimeTypes.TextPlain,
      content: ensureString(text),
    };
  }
}

export default StreamSummarizer;
