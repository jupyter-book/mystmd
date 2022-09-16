import type { ValidationOptions } from 'simple-validators';
import {
  crossValidateConditions,
  validateTemplateOption,
  validateTemplateOptions,
  validateTemplateOptionDefinition,
  validateTemplatePartDefinition,
  validateTemplateYml,
  validateTemplateDoc,
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
    expect(validateTemplateOption('input', { id: '', type: 'string' } as any, opts)).toEqual(
      'input',
    );
  });
  it('bool option validates bool', async () => {
    expect(validateTemplateOption(false, { id: '', type: 'boolean' } as any, opts)).toEqual(false);
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
    expect(validateTemplateOption(false, { id: '', type: 'string' } as any, opts)).toEqual(
      undefined,
    );
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('bool option errors with invalid bool', async () => {
    expect(validateTemplateOption('input', { id: '', type: 'boolean' } as any, opts)).toEqual(
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
    expect(validateTemplateOptions({}, [{ id: 'key', type: 'string' as any }], opts)).toEqual({});
  });
  it('missing reqired property errors', async () => {
    expect(
      validateTemplateOptions({}, [{ id: 'key', type: 'string' as any, required: true }], opts),
    ).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('missing default property fills', async () => {
    expect(
      validateTemplateOptions(
        {},
        [{ id: 'key', type: 'string' as any, required: true, default: 'value' }],

        opts,
      ),
    ).toEqual({ key: 'value' });
  });
  it('correct properties pass', async () => {
    expect(
      validateTemplateOptions(
        { a: 'value', b: true, c: '1' },
        [
          { id: 'a', type: 'string' as any },
          { id: 'b', type: 'boolean' as any, required: true },
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
          { id: 'a', type: 'string' as any },
          { id: 'b', type: 'boolean' as any, required: true },
          { id: 'c', type: 'choice' as any, choices: ['1', '2'] },
        ],

        opts,
      ),
    ).toEqual({});
    expect(opts.messages.errors?.length).toEqual(3);
  });
  it('string validation uses max_chars', async () => {
    expect(
      validateTemplateOptions(
        { a: 'a b c' },
        [{ id: 'a', type: 'string' as any, max_chars: 100 }],

        opts,
      ),
    ).toEqual({ a: 'a b c' });
  });
  it('string validation errors from max_chars', async () => {
    expect(
      validateTemplateOptions(
        { a: '1 2 3' },
        [{ id: 'a', type: 'string' as any, max_chars: 2 }],

        opts,
      ),
    ).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('condition from options not met no error', async () => {
    expect(
      validateTemplateOptions(
        {},
        [
          { id: 'a', type: 'string' as any, required: true, condition: { id: 'b' } },
          { id: 'b', type: 'string' as any },
        ],
        opts,
      ),
    ).toEqual({});
    expect(opts.messages.errors?.length).toEqual(undefined);
  });
  it('condition from options met errors', async () => {
    expect(
      validateTemplateOptions(
        { b: 'test' },
        [
          { id: 'a', type: 'string' as any, required: true, condition: { id: 'b' } },
          { id: 'b', type: 'string' as any },
        ],
        opts,
      ),
    ).toEqual({ b: 'test' });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('condition value from options not met no error', async () => {
    expect(
      validateTemplateOptions(
        { b: 'not test' },
        [
          { id: 'a', type: 'string' as any, required: true, condition: { id: 'b', value: 'test' } },
          { id: 'b', type: 'string' as any },
        ],
        opts,
      ),
    ).toEqual({ b: 'not test' });
    expect(opts.messages.errors?.length).toEqual(undefined);
  });
  it('condition value from options met errors', async () => {
    expect(
      validateTemplateOptions(
        { b: 'test' },
        [
          { id: 'a', type: 'string' as any, required: true, condition: { id: 'b', value: 'test' } },
          { id: 'b', type: 'string' as any },
        ],
        opts,
      ),
    ).toEqual({ b: 'test' });
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validateTemplateDoc', () => {
  it('frontmatter option passes through', async () => {
    expect(validateTemplateDoc({ title: 'test' }, [{ id: 'title' }], {}, opts)).toEqual({
      title: 'test',
    });
  });
  it('frontmatter condition ignored if unmet', async () => {
    expect(
      validateTemplateDoc(
        {},
        [{ id: 'title', required: true, condition: { id: 'use_title' } }],
        {},
        opts,
      ),
    ).toEqual({});
    expect(opts.messages.errors?.length).toEqual(undefined);
  });
  it('frontmatter condition errors if met', async () => {
    expect(
      validateTemplateDoc(
        {},
        [{ id: 'title', required: true, condition: { id: 'use_title' } }],
        { use_title: true },
        opts,
      ),
    ).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('frontmatter condition passes if met', async () => {
    expect(
      validateTemplateDoc(
        { title: 'test' },
        [{ id: 'title', required: true, condition: { id: 'use_title' } }],
        { use_title: true },
        opts,
      ),
    ).toEqual({ title: 'test' });
    expect(opts.messages.errors?.length).toEqual(undefined);
  });
});

describe('validateTemplateOptionDefinition', () => {
  it('invalid input errors', async () => {
    expect(validateTemplateOptionDefinition('', opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('no id errors', async () => {
    expect(validateTemplateOptionDefinition({ type: 'string' }, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('no type errors', async () => {
    expect(validateTemplateOptionDefinition({ id: 'key' }, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('id/type return self', async () => {
    expect(validateTemplateOptionDefinition({ id: 'key', type: 'string' }, opts)).toEqual({
      id: 'key',
      type: 'string',
    });
  });
  it('reserved id errors', async () => {
    expect(validateTemplateOptionDefinition({ id: 'format', type: 'string' }, opts)).toEqual(
      undefined,
    );
    expect(opts.messages.errors?.length).toEqual(1);
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
          default: 'a',
          max_chars: 10,
          condition: {
            id: 'short_title',
            value: 'test',
          },
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'choice',
      choices: ['a', 'b'],
      description: 'desc',
      required: true,
      default: 'a',
      max_chars: 10,
      condition: {
        id: 'short_title',
        value: 'test',
      },
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
  it('condition with id passes', async () => {
    expect(
      validateTemplateOptionDefinition(
        {
          id: 'key',
          type: 'string',
          condition: {
            id: 'test',
          },
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'string',
      condition: {
        id: 'test',
      },
    });
  });
  it('invalid condition errors', async () => {
    expect(
      validateTemplateOptionDefinition(
        {
          id: 'key',
          type: 'string',
          condition: {
            invalid: true,
          },
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'string',
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
});
describe('crossValidateConditions', () => {
  it('frontmatter condition id fails', async () => {
    crossValidateConditions(
      [
        {
          id: 'test',
          type: 'string' as any,
          condition: {
            id: 'short_title',
          },
        },
      ],
      [],
      [],
      opts,
    );
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('option condition id passes', async () => {
    crossValidateConditions(
      [
        {
          id: 'test',
          type: 'string' as any,
          condition: {
            id: 'prop',
            value: 'value',
          },
        },
        {
          id: 'prop',
          type: 'string' as any,
        },
      ],
      [],
      [],
      opts,
    );
    expect(opts.messages.errors?.length).toEqual(undefined);
  });
  it('unknown conditional id fails', async () => {
    crossValidateConditions(
      [
        {
          id: 'test',
          type: 'string' as any,
          condition: {
            id: 'prop',
          },
        },
      ],
      [],
      [],
      opts,
    );
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid conditional value fails', async () => {
    crossValidateConditions(
      [
        {
          id: 'test',
          type: 'string' as any,
          condition: {
            id: 'prop',
            value: true,
          },
        },
        {
          id: 'prop',
          type: 'string' as any,
        },
      ],
      [],
      [],
      opts,
    );
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('conditional id that matches definition id fails', async () => {
    crossValidateConditions(
      [
        {
          id: 'test',
          type: 'string' as any,
          condition: {
            id: 'test',
          },
        },
        {
          id: 'prop',
          type: 'string' as any,
        },
      ],
      [],
      [],
      opts,
    );
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validateTemplatePartDefinition', () => {
  it('invalid input errors', async () => {
    expect(validateTemplatePartDefinition('', opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('no id errors', async () => {
    expect(validateTemplatePartDefinition({}, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('id/type return self', async () => {
    expect(validateTemplatePartDefinition({ id: 'key' }, opts)).toEqual({ id: 'key' });
  });
  it('invalid description errors', async () => {
    expect(validateTemplatePartDefinition({ id: 'key', description: true }, opts)).toEqual({
      id: 'key',
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid required errors', async () => {
    expect(validateTemplatePartDefinition({ id: 'key', required: 'yes' }, opts)).toEqual({
      id: 'key',
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid plain errors', async () => {
    expect(validateTemplatePartDefinition({ id: 'key', plain: 'yes' }, opts)).toEqual({
      id: 'key',
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('valid part definiton passes', async () => {
    expect(
      validateTemplatePartDefinition(
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

describe('validateTemplateYml', () => {
  it('invalid input errors', async () => {
    expect(validateTemplateYml('', opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('empty object passes', async () => {
    expect(validateTemplateYml({ jtex: 'v1' }, opts)).toEqual({ jtex: 'v1' });
  });
  it('minimal object passes', async () => {
    expect(
      validateTemplateYml(
        {
          jtex: 'v1',
          title: 'test',
          description: 'test',
          version: '1.0.0',
          authors: [],
          license: 'MIT',
          tags: [],
          source: 'https://example.com',
          github: 'https://github.com/example/repo',
          thumbnail: 'thumb',
          build: {},
          schema: {},
          options: [],
          parts: [],
          doc: [],
          packages: [],
          files: [],
        },
        opts,
      ),
    ).toEqual({
      jtex: 'v1',
      title: 'test',
      description: 'test',
      version: '1.0.0',
      authors: [],
      license: {
        content: {
          free: true,
          id: 'MIT',
          osi: true,
          title: 'MIT License',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      tags: [],
      source: 'https://example.com',
      github: 'https://github.com/example/repo',
      thumbnail: 'thumb',
      build: {},
      schema: {},
      options: [],
      parts: [],
      doc: [],
      packages: [],
      files: [],
    });
  });
  it('invalid properties error', async () => {
    expect(
      validateTemplateYml(
        {
          jtex: 'v1',
          build: '',
          schema: '',
          options: [{ id: 'key' }],
          parts: [{}],
          doc: [{}],
          files: ['fake.txt'],
        },
        { ...opts, templateDir: '.' },
      ),
    ).toEqual({ jtex: 'v1', options: [], parts: [], doc: [], files: ['fake.txt'] });
    expect(opts.messages.errors?.length).toEqual(6);
  });
});
