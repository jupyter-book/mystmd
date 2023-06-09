import { describe, expect, it } from 'vitest';
import { mystParse } from 'myst-parser';
import { exerciseDirective } from '../src';

describe('exercise directive', () => {
  it('exercise directive parses', async () => {
    const content = '```{exercise} Exercise Title\n:label: ex-1\nExercise content\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'exercise',
          options: {
            label: 'ex-1',
          },
          args: 'Exercise Title',
          value: 'Exercise content',
          position: {
            start: {
              line: 0,
              column: 0,
            },
            end: {
              line: 4,
              column: 0,
            },
          },
          children: [
            {
              type: 'exercise',
              enumerated: true,
              identifier: 'ex-1',
              label: 'ex-1',
              children: [
                {
                  type: 'admonitionTitle',
                  children: [
                    {
                      type: 'text',
                      value: 'Exercise Title',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      value: 'Exercise content',
                    },
                  ],
                  position: {
                    end: {
                      column: 0,
                      line: 3,
                    },
                    start: {
                      column: 0,
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
      directives: [exerciseDirective],
    });
    expect(output).toEqual(expected);
  });
});
