import { describe, expect, it, beforeEach } from 'vitest';
import type { ValidationOptions } from 'simple-validators';
import { validateProjectConfig } from './validators';

let opts: ValidationOptions;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
});

describe('validateProjectConfig', () => {
  it('empty object returns self', async () => {
    expect(validateProjectConfig({}, opts)).toEqual({});
  });
  it('valid project config returns self', async () => {
    const projConfig = {
      remote: 'https://curvenote.com/@test/project',
      index: 'folder/readme.md',
      exclude: ['license.md'],
    };
    expect(validateProjectConfig(projConfig, opts)).toEqual(projConfig);
  });
  it('invalid exclude omitted', async () => {
    expect(validateProjectConfig({ exclude: ['license.md', 5] }, opts)).toEqual({
      exclude: ['license.md'],
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
});
