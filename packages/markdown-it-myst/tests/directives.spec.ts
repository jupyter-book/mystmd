import MarkdownIt from 'markdown-it';
import plugin from '../src';

describe('parses directives', () => {
  it('basic directive parses', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('```{abc}\n```', {});
    expect(tokens.map((t) => t.type)).toEqual(['parsed_directive_open', 'parsed_directive_close']);
    expect(tokens[0].info).toEqual('abc');
    expect(tokens[0].content).toEqual('');
  });
  it('arg/opts/body directive parses', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('```{abc} my arg\n:label: my label\n\nmy body\n```', {});
    expect(tokens.map((t) => t.type)).toEqual([
      'parsed_directive_open',
      'directive_arg_open',
      'paragraph_open',
      'inline',
      'paragraph_close',
      'directive_arg_close',
      'directive_option_open',
      'paragraph_open',
      'inline',
      'paragraph_close',
      'directive_option_close',
      'directive_body_open',
      'paragraph_open',
      'inline',
      'paragraph_close',
      'directive_body_close',
      'parsed_directive_close',
    ]);
    expect(tokens[0].info).toEqual('abc');
    expect(tokens[3].content).toEqual('my arg');
    expect(tokens[6].info).toEqual('label');
    expect(tokens[8].content).toEqual('my label');
    expect(tokens[13].content).toEqual('my body');
  });
  it('opt flag directive parses to true', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('```{abc}\n:flag:\n```', {});
    expect(tokens.map((t) => t.type)).toEqual([
      'parsed_directive_open',
      'directive_option_open',
      'paragraph_open',
      'inline',
      'paragraph_close',
      'directive_option_close',
      'parsed_directive_close',
    ]);
    expect(tokens[0].info).toEqual('abc');
    expect(tokens[1].info).toEqual('flag');
    expect(tokens[1].content).toEqual(true);
    expect(tokens[3].content).toEqual('true');
  });
  it('yaml opts directive parses', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('```{abc}\n---\na: x\nb: y\n---\n```', {});
    expect(tokens.map((t) => t.type)).toEqual([
      'parsed_directive_open',
      'directive_option_open',
      'paragraph_open',
      'inline',
      'paragraph_close',
      'directive_option_close',
      'directive_option_open',
      'paragraph_open',
      'inline',
      'paragraph_close',
      'directive_option_close',
      'parsed_directive_close',
    ]);
    expect(tokens[0].info).toEqual('abc');
    expect(tokens[1].info).toEqual('a');
    expect(tokens[3].content).toEqual('x');
    expect(tokens[6].info).toEqual('b');
    expect(tokens[8].content).toEqual('y');
  });
});
