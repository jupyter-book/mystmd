import { describe, expect, it } from 'vitest';
import { mystParse } from 'myst-parser';
import { proofDirective } from '../src';

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
              line: 1,
              column: 1,
            },
            end: {
              line: 3,
              column: 1,
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
                      position: {
                        start: {
                          line: 1,
                          column: 1,
                        },
                        end: {
                          line: 1,
                          column: 1,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      value: 'Proof content',
                      position: {
                        start: {
                          line: 2,
                          column: 1,
                        },
                        end: {
                          line: 2,
                          column: 1,
                        },
                      },
                    },
                  ],
                  position: {
                    end: {
                      column: 1,
                      line: 2,
                    },
                    start: {
                      column: 1,
                      line: 2,
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
