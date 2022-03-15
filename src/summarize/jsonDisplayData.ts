/* eslint-disable import/no-cycle */
import { DisplayData, OutputSummaryEntry } from '@curvenote/blocks';
import StringDisplayDataSummarizer from './stringDisplayData';

class JsonDisplayDataSummarizer extends StringDisplayDataSummarizer {
  prepare(): OutputSummaryEntry {
    const { data } = this.item as DisplayData;
    return {
      kind: this.kind(),
      content_type: this.content_type,
      content: JSON.stringify(data[this.content_type]),
    };
  }
}

export default JsonDisplayDataSummarizer;
