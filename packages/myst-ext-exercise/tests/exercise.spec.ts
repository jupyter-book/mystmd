import { describe, expect, it } from 'vitest';
import { mystParse } from 'myst-parser';
import { exerciseDirective } from '../src';
import { selectAll } from 'unist-util-select';

function deletePositions(tree: any) {
  selectAll('*', tree).forEach((n) => {
    delete n.position;
  });
  return tree;
}

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
    expect(deletePositions(output)).toEqual(expected);
  });
});
