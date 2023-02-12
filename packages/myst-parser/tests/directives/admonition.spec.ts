import { mystParse } from '../../src';
import { positionFn } from '../position';

describe('admonition directive default', () => {
  it('admonition directive parses with arg only', async () => {
    const content = '```{admonition} hello\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(0, 2),
          name: 'admonition',
          args: 'hello',
          children: [
            {
              type: 'admonition',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      value: 'hello',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(mystParse(content)).toEqual(expected);
  });
  it('admonition directive parses with kind/class/arg/body', async () => {
    const content = '```{tip} hello\n:class: warning\nHere is some advice\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(0, 4),
          name: 'tip',
          args: 'hello',
          options: {
            class: 'warning',
          },
          value: 'Here is some advice',
          children: [
            {
              type: 'admonition',
              kind: 'tip',
              class: 'warning',
              children: [
                {
                  type: 'admonitionTitle',
                  children: [
                    {
                      type: 'text',
                      value: 'hello',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  position: positionFn(2, 3),
                  children: [
                    {
                      type: 'text',
                      value: 'Here is some advice',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(mystParse(content)).toEqual(expected);
  });
});
