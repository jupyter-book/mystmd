import MarkdownIt from 'markdown-it';
import plugin from '../src';

describe('parses roles', () => {
  it('basic role parses', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('{abc}`hello`', {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual([
      'parsed_role_open',
      'role_body_open',
      'inline',
      'role_body_close',
      'parsed_role_close',
    ]);
    expect(tokens[1].content).toEqual('{abc}`hello`');
    expect(tokens[1].children?.[0].info).toEqual('abc');
    expect(tokens[1].children?.[0].content).toEqual('hello');
    expect(tokens[1].children?.[2].content).toEqual('hello');
  });
  it('header role parses', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('{abc}`# hello`', {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual([
      'parsed_role_open',
      'role_body_open',
      'heading_open',
      'inline',
      'heading_close',
      'role_body_close',
      'parsed_role_close',
    ]);
    expect(tokens[1].content).toEqual('{abc}`# hello`');
    expect(tokens[1].children?.[0].info).toEqual('abc');
    expect(tokens[1].children?.[0].content).toEqual('# hello');
    expect(tokens[1].children?.[3].content).toEqual('hello');
  });
});
