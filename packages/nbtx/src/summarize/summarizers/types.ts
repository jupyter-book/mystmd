/* eslint-disable import/no-cycle */
import type StringDisplayDataSummarizer from './stringDisplayData';
import type ErrorSummarizer from './error';
import type ImageSummarizer from './image';
import type StreamSummarizer from './stream';
import type SvgSummarizer from './svg';

export type Summarizer =
  | StringDisplayDataSummarizer
  | ImageSummarizer
  | SvgSummarizer
  | StreamSummarizer
  | ErrorSummarizer;

export interface SummarizerOptions {
  truncate?: boolean;
}
