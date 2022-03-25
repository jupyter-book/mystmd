import {
  CellOutput,
  CellOutputMimeTypes,
  OutputSummaryEntry,
  OutputSummaryKind,
} from '@curvenote/blocks';
import { StubFileObject } from '../src';
import Summarizer from '../src/summarize/summarizers/base';

const EXPECTED_CONTENT_LENGTH_LIMIT = 25000;

const LONG_STRING_286 = Array(EXPECTED_CONTENT_LENGTH_LIMIT + 1).join('x');
const TRUNCATED_STRING =
  "very long content that exceeds the 25000 character short content which is a suprising number of characters really , it's more than two whole tweets so lots of room for expression of ideas, json objects, some minified javascript or even a compact image in b...";

describe('summarize.summarizer.base', () => {
  test.each([
    ['with content', 'abc...', 'abc...'],
    ['missing content', undefined, ''],
    ['long content', LONG_STRING_286, TRUNCATED_STRING],
  ])('process %s', async (s, content, expectedContent) => {
    const summary = {
      kind: OutputSummaryKind.text,
      content_type: CellOutputMimeTypes.TextPlain,
      content,
    } as OutputSummaryEntry;

    const summarizer = new Summarizer(
      (path: string) => new StubFileObject(path),
      {} as CellOutput,
      '',
    );
    const processed = await summarizer.process(summary);

    expect(processed).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.text,
        content_type: CellOutputMimeTypes.TextPlain,
      }),
    );
    if (content) {
      expect(content.length).toBeGreaterThan(0);
      expect(content).toEqual(expectedContent);
    }
    if (content && content.length > EXPECTED_CONTENT_LENGTH_LIMIT) {
      expect(processed.path).toBeDefined();
      expect(processed.path).toEqual('.text_plain');
    }
  });
});
