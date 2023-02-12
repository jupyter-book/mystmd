import { mystParse } from '../../src';
import { positionFn } from '../position';

describe('code directive default', () => {
  it('code-block directive parses', async () => {
    const content = '```{code-block}\n:name: addition\n# here is math\n1+2\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(0, 5),
          name: 'code-block',
          options: {
            name: 'addition',
          },
          value: '# here is math\n1+2',
          children: [
            {
              type: 'code',
              identifier: 'addition',
              label: 'addition',
              value: '# here is math\n1+2',
            },
          ],
        },
      ],
    };
    expect(mystParse(content)).toEqual(expected);
  });
  it('code-block directive parses with language and options', async () => {
    const content =
      '```{code-block} python\n:name: addition\n:class: my-class\n:linenos:\n:lineno-start: 2\n:emphasize-lines: 3, 4\n# here is math\n1+2\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(0, 9),
          name: 'code-block',
          args: 'python',
          options: {
            name: 'addition',
            class: 'my-class',
            linenos: true,
            'lineno-start': 2,
            'emphasize-lines': '3, 4',
          },
          value: '# here is math\n1+2',
          children: [
            {
              type: 'code',
              lang: 'python',
              identifier: 'addition',
              label: 'addition',
              class: 'my-class',
              showLineNumbers: true,
              startingLineNumber: 2,
              emphasizeLines: [3, 4],
              value: '# here is math\n1+2',
            },
          ],
        },
      ],
    };
    expect(mystParse(content)).toEqual(expected);
  });
});
