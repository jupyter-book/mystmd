import { mystParse } from 'myst-parser';
import { exerciseDirective } from 'myst-ext-exercise';

describe('exercise directive', () => {
  it('exercise directive parses', async () => {
    const content = '```{exercise} Exercise Title\nExercise content\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'exercise',
          args: 'Exercise Title',
          value: 'Exercise content',
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
              type: 'exercise',
              enumerated: true,
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
      directives: [exerciseDirective],
    });
    expect(output).toEqual(expected);
  });
});
