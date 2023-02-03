import { MyST } from 'mystjs';
import cardDirectives from 'myst-ext-card';

describe('card directive', () => {
  it('card directive parses', async () => {
    const content = '```{card} Card Title\nHeader\n^^^\nCard content\n+++\nFooter\n```';
    const expected = {
      type: 'root',
      children: [
        {
          name: 'card',
          type: 'mystDirective',
          value: 'Header\n^^^\nCard content\n+++\nFooter',
          args: 'Card Title',
          children: [
            {
              type: 'card',
              children: [
                {
                  type: 'header',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: 'Header',
                        },
                      ],
                      position: {
                        end: {
                          column: 0,
                          line: 2,
                        },
                        start: {
                          column: 0,
                          line: 1,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'cardTitle',
                  children: [
                    {
                      type: 'text',
                      value: 'Card Title',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      value: 'Card content',
                    },
                  ],
                  position: {
                    end: {
                      column: 0,
                      line: 2,
                    },
                    start: {
                      column: 0,
                      line: 1,
                    },
                  },
                },
                {
                  type: 'footer',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: 'Footer',
                        },
                      ],
                      position: {
                        end: {
                          column: 0,
                          line: 2,
                        },
                        start: {
                          column: 0,
                          line: 1,
                        },
                      },
                    },
                  ],
                },
              ],
              position: {
                end: {
                  column: 0,
                  line: 7,
                },
                start: {
                  column: 0,
                  line: 0,
                },
              },
            },
          ],
        },
      ],
    };
    const myst = new MyST({
      directives: { ...cardDirectives },
    });
    expect(myst.parse(content)).toEqual(expected);
  });
});
