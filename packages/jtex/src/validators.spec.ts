import type { ValidationOptions } from '@curvenote/validators';
import {
  validateTemplateConfig,
  validateTemplateOption,
  validateTemplateOptions,
  validateTemplateOptionDefinition,
  validateTemplateTagDefinition,
  validateTemplateYml,
} from './validators';

let opts: ValidationOptions;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
});

describe('validateTemplateOption', () => {
  it('invalid option type adds error', async () => {
    expect(validateTemplateOption('', { id: '', type: 'invalid' } as any, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('string option validates string', async () => {
    expect(validateTemplateOption('input', { id: '', type: 'str' } as any, opts)).toEqual('input');
  });
  it('bool option validates bool', async () => {
    expect(validateTemplateOption(false, { id: '', type: 'bool' } as any, opts)).toEqual(false);
  });
  it('choice option validates choice', async () => {
    expect(
      validateTemplateOption(
        'a',
        { id: '', type: 'choice', choices: ['a', 'b', 'c'] } as any,
        opts,
      ),
    ).toEqual('a');
  });
  it('string option errors with invalid string', async () => {
    expect(validateTemplateOption(false, { id: '', type: 'str' } as any, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('bool option errors with invalid bool', async () => {
    expect(validateTemplateOption('input', { id: '', type: 'bool' } as any, opts)).toEqual(
      undefined,
    );
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('choice option errors with invalid choice', async () => {
    expect(
      validateTemplateOption(
        'input',
        { id: '', type: 'choice', choices: ['a', 'b', 'c'] } as any,
        opts,
      ),
    ).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validateTemplateOptions', () => {
  it('no options returns empty object', async () => {
    expect(validateTemplateOptions({ a: 1, b: 2 }, [], opts)).toEqual({});
  });
  it('non-object errors', async () => {
    expect(validateTemplateOptions('' as any, [], opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('missing optional property passes', async () => {
    expect(validateTemplateOptions({}, [{ id: 'key', type: 'str' as any }], opts)).toEqual({});
  });
  it('missing reqired property errors', async () => {
    expect(
      validateTemplateOptions({}, [{ id: 'key', type: 'str' as any, required: true }], opts),
    ).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('missing default property fills', async () => {
    expect(
      validateTemplateOptions(
        {},
        [{ id: 'key', type: 'str' as any, required: true, default: 'value' }],
        opts,
      ),
    ).toEqual({ key: 'value' });
  });
  it('correct properties pass', async () => {
    expect(
      validateTemplateOptions(
        { a: 'value', b: true, c: '1' },
        [
          { id: 'a', type: 'str' as any },
          { id: 'b', type: 'bool' as any, required: true },
          { id: 'c', type: 'choice' as any, choices: ['1', '2'] },
        ],
        opts,
      ),
    ).toEqual({ a: 'value', b: true, c: '1' });
  });
  it('bad properties error', async () => {
    expect(
      validateTemplateOptions(
        { a: true, b: 'value', c: '3' },
        [
          { id: 'a', type: 'str' as any },
          { id: 'b', type: 'bool' as any, required: true },
          { id: 'c', type: 'choice' as any, choices: ['1', '2'] },
        ],
        opts,
      ),
    ).toEqual({});
    expect(opts.messages.errors?.length).toEqual(3);
  });
  it('multiple fails with single value', async () => {
    expect(
      validateTemplateOptions(
        { a: 'value' },
        [{ id: 'a', type: 'str' as any, multiple: true }],
        opts,
      ),
    ).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('multiple validates list', async () => {
    expect(
      validateTemplateOptions(
        { a: ['value'] },
        [{ id: 'a', type: 'str' as any, multiple: true, required: true }],
        opts,
      ),
    ).toEqual({ a: ['value'] });
  });
  it('multiple required fails empty list', async () => {
    expect(
      validateTemplateOptions(
        { a: [] },
        [{ id: 'a', type: 'str' as any, multiple: true, required: true }],
        opts,
      ),
    ).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('string validation uses regex', async () => {
    expect(
      validateTemplateOptions(
        { a: 'a b c' },
        [{ id: 'a', type: 'str' as any, regex: '^[a-z\\s]*$' }],
        opts,
      ),
    ).toEqual({ a: 'a b c' });
  });
  it('string validation errors from regex', async () => {
    expect(
      validateTemplateOptions(
        { a: '1 2 3' },
        [{ id: 'a', type: 'str' as any, regex: '^[a-z\\s]*$' }],
        opts,
      ),
    ).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validateTemplateOptionDefinition', () => {
  it('invalid input errors', async () => {
    expect(validateTemplateOptionDefinition('', opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('no id errors', async () => {
    expect(validateTemplateOptionDefinition({ type: 'str' }, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('no type errors', async () => {
    expect(validateTemplateOptionDefinition({ id: 'key' }, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('id/type return self', async () => {
    expect(validateTemplateOptionDefinition({ id: 'key', type: 'str' }, opts)).toEqual({
      id: 'key',
      type: 'str',
    });
  });
  it('choice type errors with no choices', async () => {
    expect(validateTemplateOptionDefinition({ id: 'key', type: 'choice' }, opts)).toEqual(
      undefined,
    );
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('choice type passes with choices', async () => {
    expect(
      validateTemplateOptionDefinition({ id: 'key', type: 'choice', choices: ['a', 'b'] }, opts),
    ).toEqual({ id: 'key', type: 'choice', choices: ['a', 'b'] });
  });
  it('object with all properties passes', async () => {
    expect(
      validateTemplateOptionDefinition(
        {
          id: 'key',
          type: 'choice',
          choices: ['a', 'b'],
          description: 'desc',
          required: true,
          multiple: false,
          default: 'a',
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'choice',
      choices: ['a', 'b'],
      description: 'desc',
      required: true,
      multiple: false,
      default: 'a',
    });
  });
  it('invalid choices errors', async () => {
    expect(
      validateTemplateOptionDefinition(
        {
          id: 'key',
          type: 'choice',
          choices: 'a',
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'choice',
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid description errors', async () => {
    expect(
      validateTemplateOptionDefinition(
        {
          id: 'key',
          type: 'choice',
          choices: ['a', 'b'],
          description: true,
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'choice',
      choices: ['a', 'b'],
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid required errors', async () => {
    expect(
      validateTemplateOptionDefinition(
        {
          id: 'key',
          type: 'choice',
          choices: ['a', 'b'],
          required: 'yes',
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'choice',
      choices: ['a', 'b'],
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid multiple errors', async () => {
    expect(
      validateTemplateOptionDefinition(
        {
          id: 'key',
          type: 'choice',
          choices: ['a', 'b'],
          multiple: 'no',
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'choice',
      choices: ['a', 'b'],
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid default errors', async () => {
    expect(
      validateTemplateOptionDefinition(
        {
          id: 'key',
          type: 'choice',
          choices: ['a', 'b'],
          default: 'c',
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'choice',
      choices: ['a', 'b'],
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validateTemplateTagDefinition', () => {
  it('invalid input errors', async () => {
    expect(validateTemplateTagDefinition('', opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('no id errors', async () => {
    expect(validateTemplateTagDefinition({}, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('id/type return self', async () => {
    expect(validateTemplateTagDefinition({ id: 'key' }, opts)).toEqual({ id: 'key' });
  });
  it('invalid description errors', async () => {
    expect(validateTemplateTagDefinition({ id: 'key', description: true }, opts)).toEqual({
      id: 'key',
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid required errors', async () => {
    expect(validateTemplateTagDefinition({ id: 'key', required: 'yes' }, opts)).toEqual({
      id: 'key',
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid plain errors', async () => {
    expect(validateTemplateTagDefinition({ id: 'key', plain: 'yes' }, opts)).toEqual({
      id: 'key',
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('valid tag definiton passes', async () => {
    expect(
      validateTemplateTagDefinition(
        { id: 'key', description: 'desc', required: true, plain: false, extra: 'ignored' },
        opts,
      ),
    ).toEqual({
      id: 'key',
      description: 'desc',
      required: true,
      plain: false,
    });
  });
});

describe('validateTemplateConfig', () => {
  it('invalid input errors', async () => {
    expect(validateTemplateConfig('', opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('empty object passes', async () => {
    expect(validateTemplateConfig({}, opts)).toEqual({});
  });
  it('minimal object passes', async () => {
    expect(
      validateTemplateConfig({ build: {}, schema: {}, options: [], tagged: [] }, opts),
    ).toEqual({ build: {}, schema: {}, options: [], tagged: [] });
  });
  it('invalid properties error', async () => {
    expect(
      validateTemplateConfig(
        { build: '', schema: '', options: [{ id: 'key' }], tagged: [{}] },
        opts,
      ),
    ).toEqual({ options: [], tagged: [] });
    expect(opts.messages.errors?.length).toEqual(4);
  });
});

describe('validateTemplateYml', () => {
  it('invalid input errors', async () => {
    expect(validateTemplateYml('', opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('empty object passes', async () => {
    expect(validateTemplateYml({}, opts)).toEqual({});
  });
  it('minimal object passes', async () => {
    expect(validateTemplateYml({ metadata: {}, config: {} }, opts)).toEqual({
      metadata: {},
      config: {},
    });
  });
  it('invalid properties error', async () => {
    expect(
      validateTemplateYml({ metadata: {}, config: { options: [{ id: 'key' }] } }, opts),
    ).toEqual({ metadata: {}, config: { options: [] } });
    expect(opts.messages.errors?.length).toEqual(1);
  });
});
