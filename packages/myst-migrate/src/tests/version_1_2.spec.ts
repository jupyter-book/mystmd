// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, expect, it } from 'vitest';
import { migrate } from '../index';
import type { Parent } from 'mdast';

const SIMPLE_AST: Parent = {
  type: 'root',
  children: [
    {
      // @ts-expect-error: unknown type
      type: 'block',
      class: 'block-cn',
      data: { class: 'data-cn' },
    },
  ],
};

describe('update 1→2', () => {
  it('leaves a simple AST unchanged', async () => {
    const mdast = structuredClone(SIMPLE_AST) as any;
    const result = await migrate({ version: 1, mdast }, { to: 2 });
    expect(result.version).toBe(2);
    expect(mdast.children[0].class).toStrictEqual('block-cn data-cn');
    expect(mdast.children[0].data).toBe(undefined);
    expect(mdast.children[0].data?.class).toBe(undefined);
  });
});
