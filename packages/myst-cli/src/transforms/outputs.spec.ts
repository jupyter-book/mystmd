import { describe, expect, it } from 'vitest';
import { liftExpressions, liftOutputs } from './outputs';
import { mystParse } from 'myst-parser';
import type { Output, Outputs, InlineExpression } from 'myst-spec-ext';
import { VFile } from 'vfile';

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
  it('text is not quoted by default', async () => {
    const vfile = new VFile();
    const output: Output = {
      type: 'output',
      jupyter_data: {
        output_type: 'execute_result',
        data: { 'text/plain': 'Hello World' },
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
    expect(output.children).toEqual([
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello World' }] },
    ]);
  });
  it('text is quoted when requested', async () => {
    const vfile = new VFile();
    const output: Output = {
      type: 'output',
      jupyter_data: {
        output_type: 'execute_result',
        data: { 'text/plain': '"Hello World"' },
        metadata: {
          'strip-quotes': false,
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
    expect(output.children).toEqual([
      { type: 'paragraph', children: [{ type: 'text', value: '"Hello World"' }] },
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
