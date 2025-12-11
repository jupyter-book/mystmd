import { describe, expect, it } from 'vitest';
import MarkdownIt from 'markdown-it';
import plugin from '../src';

describe('parses roles', () => {
  it('basic role parses', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('ok {abc}`hello`', {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual([
      'text',
      'parsed_role_open',
      'role_body_open',
      'inline',
      'role_body_close',
      'parsed_role_close',
    ]);
    expect(tokens[1].content).toEqual('ok {abc}`hello`');
    // Pass the column information for the role
    expect((tokens[1].children?.[1] as any).col).toEqual([3, 15]);
    expect(tokens[1].children?.[1].info).toEqual('abc');
    expect(tokens[1].children?.[1].content).toEqual('hello');
    expect(tokens[1].children?.[3].content).toEqual('hello');
  });
  it('basic role is inline', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('ok {sup}`+`', {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual([
      'text',
      'parsed_role_open',
      'role_body_open',
      'inline',
      'role_body_close',
      'parsed_role_close',
    ]);
    expect(tokens[1].content).toEqual('ok {sup}`+`');
    // Pass the column information for the role
    expect((tokens[1].children?.[1] as any).col).toEqual([3, 11]);
    expect(tokens[1].children?.[1].info).toEqual('sup');
    expect(tokens[1].children?.[1].content).toEqual('+');
    expect(tokens[1].children?.[3].content).toEqual('+');
  });
  it('role is inline (no headings)', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('{abc}`# hello`', {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual([
      'parsed_role_open',
      'role_body_open',
      'inline',
      'role_body_close',
      'parsed_role_close',
    ]);
    expect(tokens[1].content).toEqual('{abc}`# hello`');
    expect(tokens[1].children?.[0].info).toEqual('abc');
    expect(tokens[1].children?.[1].content).toEqual('# hello');
    expect(tokens[1].children?.[2].content).toEqual('# hello');
  });
  it('role with spaces around name parses', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('{  abc }`hello`', {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual([
      'parsed_role_open',
      'role_body_open',
      'inline',
      'role_body_close',
      'parsed_role_close',
    ]);
    expect(tokens[1].content).toEqual('{  abc }`hello`');
    expect(tokens[1].children?.[0].info).toEqual('abc');
    expect(tokens[1].children?.[0].content).toEqual('hello');
    expect(tokens[1].children?.[2].content).toEqual('hello');
  });
  it('role with spaces inside name does not parse', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('{  ab c }`hello`', {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual(['role_error']);
  });
  it('inline role has attributes', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('{ab .c #my-id something="_blah_"}`hello`', {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual([
      'parsed_role_open',
      'myst_option_open',
      'myst_option_close',
      'myst_option_open',
      'myst_option_close',
      'myst_option_open',
      'inline',
      'myst_option_close',
      'role_body_open',
      'inline',
      'role_body_close',
      'parsed_role_close',
    ]);
    const role = tokens[1];
    expect(role.children?.[0].content).toBe('hello');
    expect(role.children?.[0].info).toBe('ab');
    expect(role.children?.[0].meta.header).toBe('ab .c #my-id something="_blah_"');
    // Classes
    expect(role.children?.[1].info).toBe('class');
    expect(role.children?.[1].content).toBe('.c');
    expect(role.children?.[1].meta).toEqual({ location: 'inline', kind: 'class', value: 'c' });
    // IDs
    expect(role.children?.[3].info).toBe('id');
    expect(role.children?.[3].content).toBe('#my-id');
    expect(role.children?.[3].meta).toEqual({ location: 'inline', kind: 'id', value: 'my-id' });
    // Attributes
    expect(role.children?.[5].info).toBe('something');
    expect(role.children?.[5].content).toBe('_blah_');
    expect(role.children?.[5].meta).toEqual({
      location: 'inline',
      kind: 'attr',
      key: 'something',
      value: '_blah_',
    });
    // Inline parse
    expect(role.children?.[6].info).toBe('');
    expect(role.children?.[6].content).toBe('_blah_');
    expect(role.children?.[6].children?.length).toBe(3);
    expect(role.children?.[6].children?.[0].tag).toBe('em');
  });
});
