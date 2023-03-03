import type { Root } from 'mdast';
import { VFile } from 'vfile';
import { figureTextTransform } from './figures';

describe('Test figures references plugin', () => {
  test.each(['figure 1', 'Figure1', 'FIG 1', 'fig1', 'Fig. 1', 'fig.1'])(
    'Figure text converted to crossReference: %s',
    (figText) => {
      const file = new VFile();
      const tree = {
        type: 'root',
        children: [
          {
            type: 'container',
            kind: 'figure',
            identifier: 'my-fig',
            label: 'my-fig',
            enumerator: '1',
            children: [],
          },
          {
            type: 'text',
            value: `Hello ${figText} world`,
          },
        ],
      };
      const expected = {
        type: 'root',
        children: [
          {
            type: 'container',
            kind: 'figure',
            identifier: 'my-fig',
            label: 'my-fig',
            enumerator: '1',
            children: [],
          },
          {
            type: 'text',
            value: 'Hello ',
          },
          {
            type: 'crossReference',
            identifier: 'my-fig',
            label: 'my-fig',
            kind: 'figure',
            children: [
              {
                type: 'text',
                value: figText,
              },
            ],
          },
          {
            type: 'text',
            value: ' world',
          },
        ],
      };
      figureTextTransform(tree as Root, file);
      expect(tree).toEqual(expected);
    },
  );
  test('Non-figure text unchanged', () => {
    const file = new VFile();
    const tree = {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'Hello world',
        },
      ],
    };
    const expected = JSON.parse(JSON.stringify(tree));
    figureTextTransform(tree as Root, file);
    expect(tree).toEqual(expected);
  });
  test.each(['Figure 1', 'Figs 1-2'])(
    'Figure text unchanged with no existing figure: %s',
    (figText) => {
      const file = new VFile();
      const tree = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: `Hello ${figText} world`,
          },
        ],
      };
      const expected = JSON.parse(JSON.stringify(tree));
      figureTextTransform(tree as Root, file);
      expect(tree).toEqual(expected);
    },
  );
  test('Multiple figure references resolve', () => {
    const file = new VFile();
    const tree = {
      type: 'root',
      children: [
        {
          type: 'container',
          kind: 'table',
          identifier: 'my-table',
          label: 'my-table',
          enumerator: '1',
          children: [],
        },
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig1',
          label: 'my-fig1',
          enumerator: '1',
          children: [],
        },
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig2',
          label: 'my-fig2',
          enumerator: '2',
          children: [],
        },
        {
          type: 'text',
          value: `Hello Fig1 world Fig2`,
        },
      ],
    };
    const expected = {
      type: 'root',
      children: [
        {
          type: 'container',
          kind: 'table',
          identifier: 'my-table',
          label: 'my-table',
          enumerator: '1',
          children: [],
        },
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig1',
          label: 'my-fig1',
          enumerator: '1',
          children: [],
        },
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig2',
          label: 'my-fig2',
          enumerator: '2',
          children: [],
        },
        {
          type: 'text',
          value: 'Hello ',
        },
        {
          type: 'crossReference',
          identifier: 'my-fig1',
          label: 'my-fig1',
          kind: 'figure',
          children: [
            {
              type: 'text',
              value: 'Fig1',
            },
          ],
        },
        {
          type: 'text',
          value: ' world ',
        },
        {
          type: 'crossReference',
          identifier: 'my-fig2',
          label: 'my-fig2',
          kind: 'figure',
          children: [
            {
              type: 'text',
              value: 'Fig2',
            },
          ],
        },
      ],
    };
    figureTextTransform(tree as Root, file);
    expect(tree).toEqual(expected);
  });
  test('Figure text in an existing crossReference should be unchanged', () => {
    const file = new VFile();
    const tree = {
      type: 'root',
      children: [
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig',
          label: 'my-fig',
          enumerator: '1',
          children: [],
        },
        {
          type: 'text',
          value: 'Hello ',
        },
        {
          type: 'crossReference',
          identifier: 'my-fig',
          label: 'my-fig',
          kind: 'figure',
          children: [
            {
              type: 'emphasis',
              children: [
                {
                  type: 'text',
                  value: 'Figure 1',
                },
              ],
            },
          ],
        },
        {
          type: 'text',
          value: ' world',
        },
      ],
    };
    const expected = JSON.parse(JSON.stringify(tree));
    figureTextTransform(tree as Root, file);
    expect(tree).toEqual(expected);
  });
  test('Second figure reference resolves after one fails', () => {
    const file = new VFile();
    const tree = {
      type: 'root',
      children: [
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig1',
          label: 'my-fig1',
          enumerator: '1',
          children: [],
        },
        {
          type: 'text',
          value: `Hello Fig2 world Fig1`,
        },
      ],
    };
    const expected = {
      type: 'root',
      children: [
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig1',
          label: 'my-fig1',
          enumerator: '1',
          children: [],
        },
        {
          type: 'text',
          value: 'Hello Fig2 world ',
        },
        {
          type: 'crossReference',
          identifier: 'my-fig1',
          label: 'my-fig1',
          kind: 'figure',
          children: [
            {
              type: 'text',
              value: 'Fig1',
            },
          ],
        },
      ],
    };
    figureTextTransform(tree as Root, file);
    expect(tree).toEqual(expected);
  });
  test('Two-figure reference text resolves to crossReferences', () => {
    const file = new VFile();
    const tree = {
      type: 'root',
      children: [
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig1',
          label: 'my-fig1',
          enumerator: '1',
          children: [],
        },
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig2',
          label: 'my-fig2',
          enumerator: '2',
          children: [],
        },
        {
          type: 'text',
          value: `Hello Fig1-2 world`,
        },
      ],
    };
    const expected = {
      type: 'root',
      children: [
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig1',
          label: 'my-fig1',
          enumerator: '1',
          children: [],
        },
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig2',
          label: 'my-fig2',
          enumerator: '2',
          children: [],
        },
        {
          type: 'text',
          value: 'Hello ',
        },
        {
          type: 'crossReference',
          identifier: 'my-fig1',
          label: 'my-fig1',
          kind: 'figure',
          children: [
            {
              type: 'text',
              value: 'Fig1',
            },
          ],
        },
        {
          type: 'text',
          value: '-',
        },
        {
          type: 'crossReference',
          identifier: 'my-fig2',
          label: 'my-fig2',
          kind: 'figure',
          children: [
            {
              type: 'text',
              value: '2',
            },
          ],
        },
        {
          type: 'text',
          value: ' world',
        },
      ],
    };
    figureTextTransform(tree as Root, file);
    expect(tree).toEqual(expected);
  });
  test('Two-figure reference text resolves first crossReference', () => {
    const file = new VFile();
    const tree = {
      type: 'root',
      children: [
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig1',
          label: 'my-fig1',
          enumerator: '1',
          children: [],
        },
        {
          type: 'text',
          value: `Hello figures 1&2 world`,
        },
      ],
    };
    const expected = {
      type: 'root',
      children: [
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig1',
          label: 'my-fig1',
          enumerator: '1',
          children: [],
        },
        {
          type: 'text',
          value: 'Hello ',
        },
        {
          type: 'crossReference',
          identifier: 'my-fig1',
          label: 'my-fig1',
          kind: 'figure',
          children: [
            {
              type: 'text',
              value: 'figures 1',
            },
          ],
        },
        {
          type: 'text',
          value: '&2 world',
        },
      ],
    };
    figureTextTransform(tree as Root, file);
    expect(tree).toEqual(expected);
  });
  test('Two-figure reference text resolves second crossReference', () => {
    const file = new VFile();
    const tree = {
      type: 'root',
      children: [
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig2',
          label: 'my-fig2',
          enumerator: '2',
          children: [],
        },
        {
          type: 'text',
          value: `Hello FIGS. 1 and 2 world`,
        },
      ],
    };
    const expected = {
      type: 'root',
      children: [
        {
          type: 'container',
          kind: 'figure',
          identifier: 'my-fig2',
          label: 'my-fig2',
          enumerator: '2',
          children: [],
        },
        {
          type: 'text',
          value: 'Hello FIGS. 1 and ',
        },
        {
          type: 'crossReference',
          identifier: 'my-fig2',
          label: 'my-fig2',
          kind: 'figure',
          children: [
            {
              type: 'text',
              value: '2',
            },
          ],
        },
        {
          type: 'text',
          value: ' world',
        },
      ],
    };
    figureTextTransform(tree as Root, file);
    expect(tree).toEqual(expected);
  });
});
