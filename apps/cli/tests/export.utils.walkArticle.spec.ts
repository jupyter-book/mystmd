import { Blocks, OutputSummaryKind } from '@curvenote/blocks';
import { outputHasHtml, outputHasImage } from '../src/export/utils';
import { Version } from '../src/models';

function makeFakeOutputVersion(
  kind: OutputSummaryKind,
  content?: string | null,
  withImage?: boolean,
) {
  let image: { kind: OutputSummaryKind }[] = [];
  if (withImage)
    image = [
      {
        kind: OutputSummaryKind.image,
      },
    ];
  return {
    data: {
      outputs: [
        ...image,
        {
          kind,
          content,
        },
      ],
    },
  } as Version<Blocks.Output>;
}

describe('export.utils', () => {
  describe('walkArticle', () => {
    describe('helper funcitons', () => {
      test.each([
        ['html with content', makeFakeOutputVersion(OutputSummaryKind.html, 'abc'), true],
        [
          'html with content and image',
          makeFakeOutputVersion(OutputSummaryKind.html, 'abc', true),
          true,
        ],
        [
          'html empty content and image',
          makeFakeOutputVersion(OutputSummaryKind.html, '', true),
          false,
        ],
        [
          'html null content and image',
          makeFakeOutputVersion(OutputSummaryKind.html, null, true),
          false,
        ],
        [
          'html undefined content and image',
          makeFakeOutputVersion(OutputSummaryKind.html, null, true),
          false,
        ],
        [
          'no html content and image',
          makeFakeOutputVersion(OutputSummaryKind.stream, null, true),
          false,
        ],
      ])(
        'outputHasHtml - %s',
        (s: string, versionLike: Version<Blocks.Output>, expected: boolean) => {
          expect(outputHasHtml(versionLike)).toEqual(expected);
        },
      );
      test.each([
        ['has image output', makeFakeOutputVersion(OutputSummaryKind.image), true],
        ['has stream output', makeFakeOutputVersion(OutputSummaryKind.stream), false],
      ])(
        'outputHasImage - %s',
        (s: string, versionLike: Version<Blocks.Output>, expected: boolean) => {
          expect(outputHasImage(versionLike)).toEqual(expected);
        },
      );
    });
  });
});
