import { describe, expect, it } from 'vitest';
import { buttonRole } from '../src';
import { VFile } from 'vfile';

describe('Button component', () => {
  it('should process button role correctly', () => {
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

  it('should process button role without label correctly', () => {
    const result = buttonRole.run({ name: 'button', body: 'http://example.com' }, new VFile());
    expect(result).toEqual([
      {
        type: 'link',
        class: 'button',
        url: 'http://example.com',
        children: [],
      },
    ]);
  });
});
