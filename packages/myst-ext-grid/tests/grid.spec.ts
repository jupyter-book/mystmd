import { describe, expect, it } from 'vitest';
import { mystParse } from 'myst-parser';
import { gridDirective } from '../src';

describe('grid directive', () => {
  it('grid directive parses', async () => {
    const content =
      '````{grid} 1 1 2 3\n\n```{grid-item-card}\nText content\n^^^\nStructure books with text files and Jupyter Notebooks with minimal configuration.\n```\n\n```{grid-item-card}\nMyST Markdown\n^^^\nWrite MyST Markdown to create enriched documents with publication-quality features.\n```\n\n```{grid-item-card}\nExecutable content\n^^^\nExecute notebook cells, store results, and insert outputs across pages.\n```\n````';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'grid',
          args: '1 1 2 3',
          value:
            '```{grid-item-card}\nText content\n^^^\nStructure books with text files and Jupyter Notebooks with minimal configuration.\n```\n\n```{grid-item-card}\nMyST Markdown\n^^^\nWrite MyST Markdown to create enriched documents with publication-quality features.\n```\n\n```{grid-item-card}\nExecutable content\n^^^\nExecute notebook cells, store results, and insert outputs across pages.\n```',
          position: {
            end: {
              column: 0,
              line: 20,
            },
            start: {
              column: 0,
              line: 0,
            },
          },
          children: [
            {
              type: 'grid',
              columns: [1, 1, 2, 3],
              children: [
                {
                  type: 'mystDirective',
                  name: 'grid-item-card',
                  value:
                    'Text content\n^^^\nStructure books with text files and Jupyter Notebooks with minimal configuration.',
                  position: {
                    end: {
                      column: 0,
                      line: 7,
                    },
                    start: {
                      column: 0,
                      line: 2,
                    },
                  },
                },
                {
                  type: 'mystDirective',
                  name: 'grid-item-card',
                  value:
                    'MyST Markdown\n^^^\nWrite MyST Markdown to create enriched documents with publication-quality features.',
                  position: {
                    end: {
                      column: 0,
                      line: 13,
                    },
                    start: {
                      column: 0,
                      line: 8,
                    },
                  },
                },
                {
                  type: 'mystDirective',
                  name: 'grid-item-card',
                  value:
                    'Executable content\n^^^\nExecute notebook cells, store results, and insert outputs across pages.',
                  position: {
                    end: {
                      column: 0,
                      line: 19,
                    },
                    start: {
                      column: 0,
                      line: 14,
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
      directives: [gridDirective],
    });
    expect(output).toEqual(expected);
  });
});
