import { mystParse } from 'myst-parser';
import { proofDirective } from 'myst-ext-proof';

describe('proof directive', () => {
  it('proof directive parses', async () => {
    const content = '```{prf:proof} Proof Title\nProof content\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'prf:proof',
          args: 'Proof Title',
          value: 'Proof content',
          position: {
            start: {
              line: 0,
              column: 0,
            },
            end: {
              line: 3,
              column: 0,
            },
          },
          children: [
            {
              type: 'proof',
              kind: 'proof',
              enumerated: true,
              children: [
                {
                  type: 'admonitionTitle',
                  children: [
                    {
                      type: 'text',
                      value: 'Proof Title',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      value: 'Proof content',
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
        },
      ],
    };
    const output = mystParse(content, {
      directives: [proofDirective],
    });
    expect(output).toEqual(expected);
  });
});
