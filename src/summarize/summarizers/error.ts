/* eslint-disable import/no-cycle */
import {
  CellOutput,
  KnownCellOutputMimeTypes,
  CellOutputType,
  ensureString,
  OutputSummaryEntry,
  OutputSummaryKind,
  Traceback,
} from '@curvenote/blocks';
import Summarizer from './base';

class ErrorSummarizer extends Summarizer {
  test(item: CellOutput): boolean {
    return item.output_type === CellOutputType.Traceback;
  }

  kind() {
    return OutputSummaryKind.error;
  }

  // errors are always summarized in one go
  next() {
    return {} as CellOutput;
  }

  prepare(): OutputSummaryEntry {
    const { traceback } = this.item as Traceback;
    return {
      kind: this.kind(),
      content_type: KnownCellOutputMimeTypes.TextPlain,
      content: ensureString(traceback),
    };
  }
}

export default ErrorSummarizer;
