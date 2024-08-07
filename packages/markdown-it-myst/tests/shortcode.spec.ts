import { describe, expect, it } from 'vitest';
import MarkdownIt from 'markdown-it';
import { default as plugin, shortcodePlugin } from '../src';

describe('parses roles', () => {
  it('basic role parses', () => {
    const mdit = MarkdownIt().use(shortcodePlugin).use(plugin);
    const tokens = mdit.parse('ok {{< var lang >}}', {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual([
      'text',
      'parsed_role_open',
      'role_body_open',
      'inline',
      'role_body_close',
      'parsed_role_close',
    ]);
    expect(tokens[1].content).toEqual('ok {{< var lang >}}');
    // Pass the column information for the role
    expect((tokens[1].children?.[1] as any).col).toEqual([3, 19]);
    expect(tokens[1].children?.[1].info).toEqual('var');
    expect(tokens[1].children?.[1].content).toEqual('lang');
    expect(tokens[1].children?.[3].content).toEqual('lang');
  });
  it('basic role parses', () => {
    const mdit = MarkdownIt().use(shortcodePlugin).use(plugin);
    const content = `Notice that the value for \`some_numbers\` is {{< var np_or_r >}},
and that this value *contains* 10 numbers.`;
    const tokens = mdit.parse(content, {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual([
      'text',
      'code_inline',
      'text',
      'parsed_role_open',
      'role_body_open',
      'inline',
      'role_body_close',
      'parsed_role_close',
      'text',
      'softbreak',
      'text',
      'em_open',
      'text',
      'em_close',
      'text',
    ]);
    expect(tokens[1].content).toEqual(content);
    // Pass the column information for the role
    expect((tokens[1].children?.[3] as any).col).toEqual([44, 63]);
    expect(tokens[1].children?.[3].info).toEqual('var');
    expect(tokens[1].children?.[3].content).toEqual('np_or_r');
    expect(tokens[1].children?.[3].content).toEqual('np_or_r');
  });
});
