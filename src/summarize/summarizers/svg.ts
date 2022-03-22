/* eslint-disable import/no-cycle */
import {
  CellOutput,
  CellOutputMimeTypes,
  CellOutputType,
  DisplayData,
  ensureString,
  ExecuteResult,
  OutputSummary,
  OutputSummaryEntry,
  OutputSummaryKind,
} from '@curvenote/blocks';
import Summarizer from './base';
import { stripTypesFromOutputData } from './utils';

class SvgSummarizer extends Summarizer {
  test(item: CellOutput): boolean {
    return (
      (item.output_type === CellOutputType.DisplayData ||
        item.output_type === CellOutputType.ExecuteResult) &&
      CellOutputMimeTypes.ImageSvg in item.data
    );
  }

  kind() {
    return OutputSummaryKind.svg;
  }

  /**
   * Remove image/svg only
   */
  next() {
    return stripTypesFromOutputData(this.item as DisplayData | ExecuteResult, [
      CellOutputMimeTypes.ImageSvg,
    ]);
  }

  prepare(): OutputSummaryEntry {
    const { data } = this.item as DisplayData;
    return {
      kind: this.kind(),
      content_type: CellOutputMimeTypes.ImageSvg,
      content: ensureString(data[CellOutputMimeTypes.ImageSvg] as string[] | string),
    };
  }

  async process(summary: OutputSummary): Promise<OutputSummaryEntry> {
    const { kind, content_type, content } = summary;
    const path = this.$makeFilepath(content_type);
    const outputFile = this.fileFactory(path);
    await outputFile.setContentType(content_type);
    await outputFile.writeString(content as string, content_type);
    return {
      kind,
      content_type,
      path,
    };
  }
}

export default SvgSummarizer;
