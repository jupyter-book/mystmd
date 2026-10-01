import { describe, expect, test } from 'vitest';
import { unified } from 'unified';
import type { LatexResult, Options } from '../src';
import mystToTex from '../src';

function toTex(options: Options) {
  const mdast = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'citeGroup',
            kind: 'parenthetical',
            children: [
              {
                type: 'cite',
                kind: 'parenthetical',
                label: 'smith2020',
                prefix: 'see',
                suffix: 'chap. 2',
              },
            ],
          },
        ],
      },
    ],
  };
  const pipe = unified().use(mystToTex, options);
  pipe.runSync(mdast as any);
  return (pipe.stringify(mdast as any).result as LatexResult).value;
}

describe('myst-to-tex citation affixes', () => {
  test('natbib', () => {
    expect(toTex({ bibliography: 'natbib' })).toEqual('\\citep[see][chap. 2]{smith2020}');
  });
  test('biblatex', () => {
    expect(toTex({ bibliography: 'biblatex' })).toEqual('\\parencite[see][chap. 2]{smith2020}');
  });
  test('numerical-only citations only have a suffix', () => {
    expect(toTex({ citestyle: 'numerical-only' })).toEqual('\\cite[chap. 2]{smith2020}');
  });
});
