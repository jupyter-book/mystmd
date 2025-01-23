import { describe, expect, it } from 'vitest';
import { transformRenderInlineExpressions } from './inlineExpressions';
import { VFile } from 'vfile';
import type { InlineExpression } from 'myst-spec-ext';

describe('fileFromRelativePath', () => {
  it('inline text is not quoted', async () => {
    const vfile = new VFile();
    const expr = {
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
    } as InlineExpression;
    const tree = { type: 'root', children: [expr] };
    transformRenderInlineExpressions(tree, vfile);
    // Children are added and quotes are removed
    expect(expr.children).toEqual([{ type: 'text', value: 'hello there' }]);
  });
});
