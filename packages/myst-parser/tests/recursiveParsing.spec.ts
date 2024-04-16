import { describe, expect, test } from 'vitest';
import { VFile } from 'vfile';
import { mystParse } from '../src';
import { basicTransformations } from 'myst-transforms';
import { selectAll } from 'unist-util-select';
import type { DirectiveSpec, GenericNode } from 'myst-common';
import { subscriptRole } from 'myst-roles';

const parseAgain: DirectiveSpec = {
  name: 'parse',
  body: { type: String },
  run(data, file, ctx) {
    const lines = (data.body as string).split('\n');
    const skippedLine = lines.slice(1).join('\n');
    const result = ctx.parseMyst(skippedLine, 1); // add 1 to the offset!
    return [
      { type: 'parse', children: result.children, data: { firstLine: lines[0] } },
    ] as GenericNode[];
  },
};

describe('recursive parsing', () => {
  test('', () => {
    const src = `::::{parse}
first line
:::{parse}
second line
H{sub}\`2\`O
:::
::::
`;
    const vfile = new VFile();
    const tree = mystParse(src, { directives: [parseAgain], roles: [subscriptRole] });
    basicTransformations(tree, vfile, {});
    const [one, two] = selectAll('parse', tree);
    expect(one.data?.firstLine).toBe('first line');
    expect(two.data?.firstLine).toBe('second line');
    const paragraphs = selectAll('paragraph', tree);
    expect(paragraphs.length).toBe(1);
    expect(paragraphs[0].position?.start.line).toBe(5);
    expect(paragraphs[0].position?.end.line).toBe(5);
    const text = selectAll('text', tree);
    expect(text.length).toBe(2);
    expect(text[0].position?.end.line).toBe(5);
    expect(text[1].position?.end.line).toBe(5);
    const subscript = selectAll('subscript', tree);
    expect(subscript.length).toBe(1);
    expect(subscript[1].position?.end.line).toBe(5);
  });
});
