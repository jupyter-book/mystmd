import { describe, expect, it } from 'vitest';
import { liftExpressions, liftOutputs } from './outputs';
import { mystParse } from 'myst-parser';
import type { Output, Outputs, InlineExpression } from 'myst-spec-ext';
import { VFile } from 'vfile';
import { reduceOutputs, stringIsMatplotlibOutput } from './outputs';
import { Session } from '../session/session';

const parseMyst = (content: string) => mystParse(content);

describe('liftExpressions', () => {
  it('inline text is not quoted by default', async () => {
    const vfile = new VFile();
    const expr: InlineExpression = {
      type: 'inlineExpression',
      value: '"hello " + "there"',
      result: {
        status: 'ok',
        data: {
          // Note the wrapping quotes!
          'text/plain': "'hello there'",
        },
        metadata: {},
      },
      children: [],
    };
    const tree = { type: 'root', children: [expr] };
    await liftExpressions(tree, vfile, { parseMyst });
    // Children are added and quotes are removed
    expect(expr.children).toEqual([{ type: 'text', value: 'hello there' }]);
  });
  it('inline ast is lifted', async () => {
    const vfile = new VFile();
    const inlineTextAST = {
      type: 'text',
      value: 'I’m a programatically generated figure from AST. See other figures...',
    };
    const inlineAST = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [inlineTextAST],
        },
      ],
    };
    const expr: InlineExpression = {
      type: 'inlineExpression',
      value: 'some_expr',
      result: {
        status: 'ok',
        data: {
          'application/vnd.mystmd.ast+json;version=1': inlineAST,
        },
        metadata: {},
      },
      children: [],
    };
    const tree = { type: 'root', children: [expr] };
    await liftExpressions(tree, vfile, { parseMyst });
    // Children are added and quotes are removed
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'inlineExpression',
          value: 'some_expr',
          result: {
            status: 'ok',
            data: {
              'application/vnd.mystmd.ast+json;version=1': inlineAST,
            },
            metadata: {},
          },
          children: [inlineTextAST],
        },
      ],
    });
  });
  it('inline text is quoted when requested', async () => {
    const vfile = new VFile();
    const expr: InlineExpression = {
      type: 'inlineExpression',
      value: '"hello " + "there"',
      result: {
        status: 'ok',
        data: {
          // Note the wrapping quotes!
          'text/plain': "'hello there'",
        },
        metadata: {
          'strip-quotes': false,
        },
      },
    };
    const tree = { type: 'root', children: [expr] };
    await liftExpressions(tree, vfile, { parseMyst });
    // Children are added and quotes are preserved
    expect(expr.children).toEqual([{ type: 'text', value: "'hello there'" }]);
  });
  it('inline Markdown is parsed and lifted', async () => {
    const vfile = new VFile();
    const expr: InlineExpression = {
      type: 'inlineExpression',
      value: 'some_expr',
      children: [],
      result: {
        status: 'ok',
        data: {
          'text/plain': 'hello there',
          'text/markdown': '*hello* there',
        },
      },
    };
    const tree = { type: 'root', children: [expr] };
    await liftExpressions(tree, vfile, { parseMyst });
    // Children are added and quotes are preserved
    expect(expr.children).toMatchObject([
      {
        type: 'emphasis',
        children: [
          {
            type: 'text',
            value: 'hello',
          },
        ],
      },
      {
        type: 'text',
        value: ' there',
      },
    ]);
  });
});
describe('liftOutputs', () => {
  it('LaTeX is parsed and lifted', async () => {
    const vfile = new VFile();
    const output: Output = {
      type: 'output',
      jupyter_data: {
        output_type: 'execute_result',
        data: {
          'text/plain': 'hello there\nx + y',
          'text/latex': '\\textbf{hello} there\n$$\nx + y\n$$',
        },
      },
      children: [],
    };
    const outputs: Outputs = {
      type: 'outputs',
      children: [output],
    };

    const tree = { type: 'root', children: [outputs] };
    await liftOutputs(tree, vfile, { parseMyst });
    // Children are added and quotes are preserved
    expect(output.children).toMatchObject([
      {
        type: 'paragraph',
        children: [
          { type: 'strong', children: [{ type: 'text', value: 'hello' }] },
          { type: 'text', value: ' there' },
        ],
      },
      {
        type: 'math',
        value: 'x + y',
      },
    ]);
  });
  it('Markdown is parsed and lifted', async () => {
    const vfile = new VFile();
    const output: Output = {
      type: 'output',
      jupyter_data: {
        output_type: 'execute_result',
        data: {
          'text/plain': 'hello there',
          'text/markdown': '*hello* there',
        },
      },
      children: [],
    };
    const outputs: Outputs = {
      type: 'outputs',
      children: [output],
    };

    const tree = { type: 'root', children: [outputs] };
    await liftOutputs(tree, vfile, { parseMyst });
    // Children are added and quotes are preserved
    expect(output.children).toMatchObject([
      {
        type: 'paragraph',
        children: [
          {
            type: 'emphasis',
            children: [
              {
                type: 'text',
                value: 'hello',
              },
            ],
          },
          {
            type: 'text',
            value: ' there',
          },
        ],
      },
    ]);
  });
  it('ast is lifted', async () => {
    const vfile = new VFile();
    const inlineParagraphAST = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'I’m a programatically generated figure from AST. See other figures...',
        },
      ],
    };
    const inlineAST = {
      type: 'root',
      children: [inlineParagraphAST],
    };
    const output: Output = {
      type: 'output',
      jupyter_data: {
        output_type: 'execute_result',
        data: {
          'application/vnd.mystmd.ast+json;version=1': inlineAST,
        },
      },
      children: [],
    };
    const outputs: Outputs = {
      type: 'outputs',
      children: [output],
    };
    const tree = { type: 'root', children: [outputs] };
    await liftOutputs(tree, vfile, { parseMyst });
    // Children are added and quotes are removed
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'outputs',
          children: [
            {
              type: 'output',
              jupyter_data: {
                output_type: 'execute_result',
                data: {
                  'application/vnd.mystmd.ast+json;version=1': inlineAST,
                },
              },
              children: [inlineParagraphAST],
            },
          ],
        },
      ],
    });
  });
});

describe('reduceOutputs', () => {
  it('output with no data is removed', async () => {
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'hi',
                },
              ],
            },
            {
              type: 'outputs',
              children: [
                {
                  type: 'output',
                  id: 'abc123',
                  jupyter_data: null,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };
    reduceOutputs(new Session(), mdast, 'notebook.ipynb', '/my/folder');
    expect(mdast).toEqual({
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'hi',
                },
              ],
            },
          ],
        },
      ],
    });
  });
  it('output with complex data is removed', async () => {
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'hi',
                },
              ],
            },
            {
              type: 'outputs',
              id: 'abc123',
              children: [
                {
                  type: 'output',
                  children: [],
                  jupyter_data: {
                    output_type: 'display_data',
                    execution_count: 3,
                    metadata: {},
                    data: {
                      'application/octet-stream': {
                        content_type: 'application/octet-stream',
                        hash: 'def456',
                        path: '/my/path/def456.png',
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    expect(mdast.children[0].children.length).toEqual(2);
    reduceOutputs(new Session(), mdast, 'notebook.ipynb', '/my/folder');
    expect(mdast).toEqual({
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'hi',
                },
              ],
            },
          ],
        },
      ],
    });
  });
  it('outputs is replaced with placeholder image', async () => {
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'hi',
                },
              ],
            },
            {
              type: 'outputs',
              id: 'abc123',
              children: [
                {
                  type: 'image',
                  placeholder: true,
                  url: 'placeholder.png',
                },
              ],
            },
          ],
        },
      ],
    };
    expect(mdast.children[0].children.length).toEqual(2);
    reduceOutputs(new Session(), mdast, 'notebook.ipynb', '/my/folder');
    expect(mdast).toEqual({
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'hi',
                },
              ],
            },
            {
              type: 'image',
              placeholder: true,
              url: 'placeholder.png',
            },
          ],
        },
      ],
    });
  });
  it.each([
    ['<Figure size 720x576 with 1 Axes>', true],
    ['<matplotlib.legend.Legend at 0x7fb7fc701b90>', true],
    ["Text(0.5, 0.98, 'Test 1')", true],
    [
      '(<Figure size 1224x576 with 1 Axes>,\n<matplotlib.axes._subplots.AxesSubplot at 0x7fd733d23e90>)',
      true,
    ],
    ['Not matplotlib', false],
  ])('%s', (string, bool) => {
    expect(stringIsMatplotlibOutput(string)).toBe(bool);
  });
});
