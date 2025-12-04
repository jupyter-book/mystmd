import { describe, expect, it } from 'vitest';
import { buttonRole } from '../src';
import { VFile } from 'vfile';

describe('Button component', () => {
  it('should process body<label> syntax correctly', () => {
    const result = buttonRole.run(
      { name: 'button', body: 'Click me<http://example.com>' },
      new VFile(),
    );

    expect(result).toEqual([
      {
        type: 'link',
        class: 'button',
        url: 'http://example.com',
        children: [{ type: 'text', value: 'Click me' }],
      },
    ]);
  });

  it('should process autolink-style bodies', () => {
    const result = buttonRole.run({ name: 'button', body: '<http://example.com>' }, new VFile());
    expect(result).toEqual([
      {
        type: 'link',
        class: 'button',
        url: 'http://example.com',
        children: [{ type: 'text', value: 'http://example.com' }],
      },
    ]);
  });

  it('should treat bare text (even if it looks like a URL) as a non-link button', () => {
    const result = buttonRole.run({ name: 'button', body: 'http://example.com' }, new VFile());
    expect(result).toEqual([
      {
        type: 'span',
        class: 'button',
        children: [{ type: 'text', value: 'http://example.com' }],
      },
    ]);
  });

  it('should display body text with no link when no URL is provided', () => {
    const result = buttonRole.run({ name: 'button', body: 'Click me' }, new VFile());
    expect(result).toEqual([
      {
        type: 'span',
        class: 'button',
        children: [{ type: 'text', value: 'Click me' }],
      },
    ]);
  });
});
