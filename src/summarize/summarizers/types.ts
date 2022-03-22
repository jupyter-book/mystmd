import StringDisplayDataSummarizer from './stringDisplayData';
import ErrorSummarizer from './error';
import ImageSummarizer from './image';
import StreamSummarizer from './stream';
import SvgSummarizer from './svg';

export type Summarizer =
  | StringDisplayDataSummarizer
  | ImageSummarizer
  | SvgSummarizer
  | StreamSummarizer
  | ErrorSummarizer;

export interface SummarizerOptions {
  truncate?: boolean;
}
