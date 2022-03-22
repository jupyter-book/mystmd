/* eslint-disable import/no-cycle */
import {
  CellOutput,
  CellOutputMimeTypes,
  CellOutputType,
  DisplayData,
  ensureString,
  ExecuteResult,
  OutputSummaryEntry,
  OutputSummaryKind,
} from '@curvenote/blocks';
import { IFileObjectFactoryFn } from '../../files';
import Summarizer from './base';
import { SummarizerOptions } from './types';
import { stripTypesFromOutputData } from './utils';

class StringDisplayDataSummarizer extends Summarizer {
  myKind: OutputSummaryKind;

  content_type: CellOutputMimeTypes;

  additionalTypesToStrip: CellOutputMimeTypes[];

  constructor(
    fileFactory: IFileObjectFactoryFn,
    item: CellOutput,
    basepath: string,
    kind: OutputSummaryKind,
    content_type: CellOutputMimeTypes,
    additionalTypesToStrip: CellOutputMimeTypes[],
    options?: SummarizerOptions,
  ) {
    super(fileFactory, item, basepath, options);
    this.myKind = kind;
    this.content_type = content_type;
    this.additionalTypesToStrip = additionalTypesToStrip;
  }

  test(item: CellOutput): boolean {
    return (
      (item.output_type === CellOutputType.DisplayData ||
        item.output_type === CellOutputType.ExecuteResult) &&
      this.content_type in item.data
    );
  }

  kind() {
    return this.myKind;
  }

  next() {
    return stripTypesFromOutputData(this.item as DisplayData | ExecuteResult, [
      this.content_type,
      ...this.additionalTypesToStrip,
    ]);
  }

  prepare(): OutputSummaryEntry {
    const { data } = this.item as DisplayData;
    return {
      kind: this.kind(),
      content_type: this.content_type,
      content: ensureString(data[this.content_type] as string[] | string),
    };
  }
}

export default StringDisplayDataSummarizer;
