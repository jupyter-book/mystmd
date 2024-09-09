import { describe, expect, it } from 'vitest';
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
      'inline',
      'directive_arg_close',
      'directive_option_open',
      'inline',
      'directive_option_close',
      'directive_body_open',
      'paragraph_open',
      'inline',
      'paragraph_close',
      'directive_body_close',
      'parsed_directive_close',
    ]);
    expect(tokens[0].info).toEqual('abc');
    expect(tokens[2].content).toEqual('my arg');
    expect(tokens[4].info).toEqual('label');
    expect(tokens[5].content).toEqual('my label');
    expect(tokens[9].content).toEqual('my body');
  });
  it('opt flag directive parses to true', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('```{abc}\n:flag:\n```', {});
    expect(tokens.map((t) => t.type)).toEqual([
      'parsed_directive_open',
      'directive_option_open',
      'directive_option_close',
      'parsed_directive_close',
    ]);
    expect(tokens[0].info).toEqual('abc');
    expect(tokens[1].info).toEqual('flag');
    expect(tokens[1].content).toEqual('');
    expect(tokens[1].meta.value).toEqual(true);
  });
  it('opt flag with space directive parses to true', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('```{abc}\n:flag: \n```', {});
    expect(tokens.map((t) => t.type)).toEqual([
      'parsed_directive_open',
      'directive_option_open',
      'directive_option_close',
      'parsed_directive_close',
    ]);
    expect(tokens[0].info).toEqual('abc');
    expect(tokens[1].info).toEqual('flag');
    expect(tokens[1].content).toEqual('');
    expect(tokens[1].meta.value).toEqual(true);
  });
  it('colon in first line is not option', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('```{abc}\nhttp://example:5050\n```', {});
    expect(tokens.map((t) => t.type)).toEqual([
      'parsed_directive_open',
      'directive_body_open',
      'paragraph_open',
      'inline',
      'paragraph_close',
      'directive_body_close',
      'parsed_directive_close',
    ]);
    expect(tokens[0].info).toEqual('abc');
    expect(tokens[0].content).toEqual('http://example:5050');
  });
  it('colon option with space is not option', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('```{abc}\n:space option: no\n```', {});
    expect(tokens.map((t) => t.type)).toEqual([
      'parsed_directive_open',
      'directive_body_open',
      'paragraph_open',
      'inline',
      'paragraph_close',
      'directive_body_close',
      'parsed_directive_close',
    ]);
    expect(tokens[0].info).toEqual('abc');
    expect(tokens[0].content).toEqual(':space option: no');
  });
  it('colon option stops at first colon', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('```{abc}\n:key:val:val\n```', {});
    expect(tokens.map((t) => t.type)).toEqual([
      'parsed_directive_open',
      'directive_option_open',
      'inline',
      'directive_option_close',
      'parsed_directive_close',
    ]);
    expect(tokens[0].info).toEqual('abc');
    expect(tokens[1].info).toEqual('key');
    expect(tokens[1].content).toEqual('val:val');
  });
  it('colon fence is not an option', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('```{abc}\n:::{xyz}\n:::\n```', {});
    expect(tokens.map((t) => t.type)).toEqual([
      'parsed_directive_open',
      'directive_body_open',
      'paragraph_open',
      'inline',
      'paragraph_close',
      'directive_body_close',
      'parsed_directive_close',
    ]);
    expect(tokens[0].info).toEqual('abc');
  });
  it('yaml opts directive parses', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('```{abc}\n---\na: x\nb: y\n---\n```', {});
    expect(tokens.map((t) => t.type)).toEqual([
      'parsed_directive_open',
      'directive_option_open',
      'inline',
      'directive_option_close',
      'directive_option_open',
      'inline',
      'directive_option_close',
      'parsed_directive_close',
    ]);
    expect(tokens[0].info).toEqual('abc');
    expect(tokens[1].info).toEqual('a');
    expect(tokens[2].content).toEqual('x');
    expect(tokens[4].info).toEqual('b');
    expect(tokens[5].content).toEqual('y');
  });
  it('nested directive parses', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('````{abc}\n\n```{xyz}\n```\n\n````', {});
    expect(tokens.map((t) => t.type)).toEqual([
      'parsed_directive_open',
      'directive_body_open',
      'parsed_directive_open',
      'parsed_directive_close',
      'directive_body_close',
      'parsed_directive_close',
    ]);
    expect(tokens[0].info).toEqual('abc');
    expect(tokens[2].info).toEqual('xyz');
  });
  it('parses directives with spaces', () => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('````  { abc }\n\n``` { xyz }\n```\n\n````', {});
    expect(tokens.map((t) => t.type)).toEqual([
      'parsed_directive_open',
      'directive_body_open',
      'parsed_directive_open',
      'parsed_directive_close',
      'directive_body_close',
      'parsed_directive_close',
    ]);
    expect(tokens[0].info).toEqual('abc');
    expect(tokens[2].info).toEqual('xyz');
  });
  it('directives cannot have spaces', () => {
    // We may change this in the future, if we add pandoc support
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse('```` { ab c }\n\n``` { xyz }\n```\n\n````', {});
    expect(tokens.map((t) => t.type)).toEqual(['fence']);
    expect(tokens[0].info).toEqual(' { ab c }');
  });
  it.each([
    [false, 'Paragraph\n\n```{math}\nAx=b\n```\n\nAfter paragraph'],
    [false, '```{math}\nAx=b\n```'],
    [false, '```{math}\nAx=b\n```\n\nAfter paragraph'],
    [true, 'Paragraph\n```{math}\nAx=b\n```\nAfter paragraph'],
    ['before', 'Paragraph\n```{math}\nAx=b\n```\n\nAfter paragraph'],
    ['before', 'Paragraph\n```{math}\nAx=b\n```'],
    ['after', 'Paragraph\n\n```{math}\nAx=b\n```\nAfter paragraph'],
    ['after', '```{math}\nAx=b\n```\nAfter paragraph'],
  ])('directives have tightness information: "%s"', (tight, src) => {
    const mdit = MarkdownIt().use(plugin);
    const tokens = mdit.parse(src, {});
    const open = tokens.find((t) => t.type === 'parsed_directive_open');
    expect(open?.meta.tight).toBe(tight);
  });
});
