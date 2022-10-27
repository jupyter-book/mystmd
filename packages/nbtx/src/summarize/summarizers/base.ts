/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/no-cycle */
import {
  CellOutput,
  KnownCellOutputMimeTypes,
  OutputSummaryKind,
  OutputSummaryEntry,
} from '@curvenote/blocks';
import { IFileObjectFactoryFn } from '../../files';
import { SummarizerOptions } from './types';

const NUM_CHARS = 25000;
const TRUNCATED_CHARS_COUNT = 64;

class Summarizer {
  fileFactory: IFileObjectFactoryFn;

  item: CellOutput;

  basepath: string;

  options: SummarizerOptions;

  constructor(
    fileFactory: IFileObjectFactoryFn,
    item: CellOutput,
    basepath: string,
    options: SummarizerOptions = { truncate: true },
  ) {
    this.fileFactory = fileFactory;
    this.item = item;
    this.basepath = basepath;
    this.options = options;
  }

  test(outputItem: CellOutput): boolean {
    throw new Error('test not implemented in base class');
  }

  static new(
    fileFactory: IFileObjectFactoryFn,
    kind: OutputSummaryKind,
    item: CellOutput,
    basepath: string,
    options?: SummarizerOptions,
  ): Summarizer | null {
    throw new Error('Implemented in factory.ts to avoid dependency cycles.');
  }

  kind(): OutputSummaryKind {
    return OutputSummaryKind.unknown;
  }

  $makeFilepath(contentType: KnownCellOutputMimeTypes): string {
    return `${this.basepath}.${contentType.replace('/', '_')}`;
  }

  /**
   *  Returns a modified version of the cell otuput containing the reamining data for processing
   * if any or null
   */
  next(): CellOutput {
    throw new Error('`next()` not implemented in base class');
  }

  prepare(): OutputSummaryEntry {
    throw new Error('prepare not implemented in base class');
  }

  async process(summary: OutputSummaryEntry): Promise<OutputSummaryEntry> {
    let { content } = summary;
    if (this.options.truncate && content && content?.length > NUM_CHARS) {
      const path = this.$makeFilepath(summary.content_type);
      const outputFile = this.fileFactory(path);
      await outputFile.writeString(content as string, summary.content_type);
      content = `${content.slice(0, TRUNCATED_CHARS_COUNT)}...`;
      return {
        kind: summary.kind,
        content_type: summary.content_type,
        content: content ?? '',
        path: outputFile.id,
      };
    }
    return {
      kind: summary.kind,
      content_type: summary.content_type,
      content: content ?? '',
    };
  }
}

export default Summarizer;
