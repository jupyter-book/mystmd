import { fromDTO, outputSummaryFromDTO, OutputSummaryKind } from './output';
import { KnownCellOutputMimeTypes, TARGET } from './types';

describe('blocks.output', () => {
  test('outputSummaryFromDTO', () => {
    const json = {
      kind: OutputSummaryKind.json,
      content_type: KnownCellOutputMimeTypes.AppJson,
      content: 'abc...',
      link: 'https://iooxa.com',
      alternate: {
        [OutputSummaryKind.text]: {
          kind: OutputSummaryKind.text,
          content_type: KnownCellOutputMimeTypes.TextPlain,
          content: 'abc...',
          link: 'https://iooxa.com',
        },
      },
    };
    const summary = outputSummaryFromDTO(json);
    expect(summary).toEqual(expect.objectContaining(json));
  });
  test('outputSummaryFromDTO missing alternate', () => {
    const json = {
      kind: OutputSummaryKind.json,
      content_type: KnownCellOutputMimeTypes.AppJson,
      content: 'abc...',
      link: 'https://iooxa.com',
    };
    const summary = outputSummaryFromDTO(json);
    expect(summary).toEqual(expect.objectContaining(json));
    expect(summary.alternate).toBeEmpty();
  });
  test('fromDTO', () => {
    const json = {
      targets: TARGET.JupyterOutput,
      original: { a: 1 },
      outputs: [],
      size: 1000,
      content_type: 'of/uploaded/file/so/json',
      md5: 'qwerty1234567',
    };
    const partialOutput = fromDTO(json);
    expect(partialOutput).toEqual(expect.objectContaining(json));
  });
  test('fromDTO missing fields', () => {
    const json = {
      original: { a: 1 },
    };
    const partialOutput = fromDTO(json);
    expect(partialOutput).toEqual(expect.objectContaining(json));
    expect(partialOutput).toEqual(
      expect.objectContaining({
        targets: [],
        outputs: [],
        size: 0,
        content_type: '',
        md5: '',
      }),
    );
  });
});
