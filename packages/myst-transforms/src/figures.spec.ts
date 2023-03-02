import type { Root } from 'mdast';
import { VFile } from 'vfile';
import { figureTextTransform } from './figures';

describe('Test figures plugin', () => {
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
  test('Figure text unchanged with no existing figure', () => {
    const file = new VFile();
    const tree = {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'Hello Figure 1 world',
        },
      ],
    };
    const expected = JSON.parse(JSON.stringify(tree));
    figureTextTransform(tree as Root, file);
    expect(tree).toEqual(expected);
  });
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
});
