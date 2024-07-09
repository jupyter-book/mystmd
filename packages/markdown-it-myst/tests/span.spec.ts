import { describe, expect, it } from 'vitest';
import MarkdownIt from 'markdown-it';
import plugin from '../src';

describe('parses spans', () => {
  it('basic span parses', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('ok [content]{.python}', {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual([
      'text',
      'parsed_role_open',
      'role_body_open',
      'inline',
      'role_body_close',
      'parsed_role_close',
    ]);
    expect(tokens[1].content).toEqual('ok [content]{.python}');
    // Pass the column information for the role
    expect((tokens[1].children?.[1] as any).col).toEqual([3, 21]);
    expect(tokens[1].children?.[1].info).toEqual('span');
    expect(tokens[1].children?.[1].content).toEqual('content');
    expect(tokens[1].children?.[3].content).toEqual('content');
  });
});
