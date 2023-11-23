import { describe, expect, it, beforeEach } from 'vitest';
import type { ValidationOptions } from 'simple-validators';
import { Session } from './session';
import {
  crossValidateConditions,
  validateTemplateOption,
  validateTemplateOptions,
  validateTemplateOptionDefinition,
  validateTemplatePartDefinition,
  validateTemplateYml,
  validateTemplateDoc,
  validateTemplateParts,
} from './validators';

let opts: ValidationOptions;
let session: Session;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
  session = new Session();
});

describe('validateTemplateOption', () => {
  it('invalid option type adds error', async () => {
    expect(validateTemplateOption(session, '', { id: '', type: 'invalid' } as any, opts)).toEqual(
      undefined,
    );
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('string option validates string', async () => {
    expect(
      validateTemplateOption(session, 'input', { id: '', type: 'string' } as any, opts),
    ).toEqual('input');
  });
  it('bool option validates bool', async () => {
    expect(
      validateTemplateOption(session, false, { id: '', type: 'boolean' } as any, opts),
    ).toEqual(false);
  });
  it('choice option validates choice', async () => {
    expect(
      validateTemplateOption(
        session,
        'a',
        { id: '', type: 'choice', choices: ['a', 'b', 'c'] } as any,
        opts,
      ),
    ).toEqual('a');
  });
  it('string option errors with invalid string', async () => {
    expect(validateTemplateOption(session, false, { id: '', type: 'string' } as any, opts)).toEqual(
      undefined,
    );
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('bool option errors with invalid bool', async () => {
    expect(
      validateTemplateOption(session, 'input', { id: '', type: 'boolean' } as any, opts),
    ).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('choice option errors with invalid choice', async () => {
    expect(
      validateTemplateOption(
        session,
        'input',
        { id: '', type: 'choice', choices: ['a', 'b', 'c'] } as any,
        opts,
      ),
    ).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('number option validates number', async () => {
    expect(validateTemplateOption(session, -0.5, { id: '', type: 'number' } as any, opts)).toEqual(
      -0.5,
    );
  });
  it('number option validates string number', async () => {
    expect(
      validateTemplateOption(session, '-0.5', { id: '', type: 'number' } as any, opts),
    ).toEqual(-0.5);
  });
  it('number option with min/max/integer validates number', async () => {
    expect(
      validateTemplateOption(
        session,
        10,
        { id: '', type: 'number', min: 9, max: 10, integer: true } as any,
        opts,
      ),
    ).toEqual(10);
  });
  it('number option errors with < min', async () => {
    expect(
      validateTemplateOption(
        session,
        8,
        { id: '', type: 'number', min: 9, max: 10, integer: true } as any,
        opts,
      ),
    ).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('number option errors with > max', async () => {
    expect(
      validateTemplateOption(
        session,
        11,
        { id: '', type: 'number', min: 9, max: 10, integer: true } as any,
        opts,
      ),
    ).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('number option errors with non-integer', async () => {
    expect(
      validateTemplateOption(
        session,
        9.5,
        { id: '', type: 'number', min: 9, max: 10, integer: true } as any,
        opts,
      ),
    ).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('number option errors with non-number string', async () => {
    expect(
      validateTemplateOption(session, 'invalid', { id: '', type: 'number' } as any, opts),
    ).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validateTemplateOptions', () => {
  it('no options returns empty object', async () => {
    expect(validateTemplateOptions(session, { a: 1, b: 2 }, [], opts)).toEqual({});
  });
  it('non-object errors', async () => {
    expect(validateTemplateOptions(session, '' as any, [], opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('missing optional property passes', async () => {
    expect(
      validateTemplateOptions(session, {}, [{ id: 'key', type: 'string' as any }], opts),
    ).toEqual({});
  });
  it('missing reqired property errors', async () => {
    expect(
      validateTemplateOptions(
        session,
        {},
        [{ id: 'key', type: 'string' as any, required: true }],
        opts,
      ),
    ).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('missing default property fills', async () => {
    expect(
      validateTemplateOptions(
        session,
        {},
        [{ id: 'key', type: 'string' as any, required: true, default: 'value' }],

        opts,
      ),
    ).toEqual({ key: 'value' });
  });
  it('correct properties pass', async () => {
    expect(
      validateTemplateOptions(
        session,
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
        session,
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
        session,
        { a: 'a b c' },
        [{ id: 'a', type: 'string' as any, max_chars: 100 }],

        opts,
      ),
    ).toEqual({ a: 'a b c' });
  });
  it('string validation errors from max_chars', async () => {
    expect(
      validateTemplateOptions(
        session,
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
        session,
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
        session,
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
        session,
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
        session,
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
    expect(validateTemplateOptionDefinition(session, '', opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('no id errors', async () => {
    expect(validateTemplateOptionDefinition(session, { type: 'string' }, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('no type errors', async () => {
    expect(validateTemplateOptionDefinition(session, { id: 'key' }, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('id/type return self', async () => {
    expect(validateTemplateOptionDefinition(session, { id: 'key', type: 'string' }, opts)).toEqual({
      id: 'key',
      type: 'string',
    });
  });
  it('reserved id errors', async () => {
    expect(
      validateTemplateOptionDefinition(session, { id: 'format', type: 'string' }, opts),
    ).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('choice type errors with no choices', async () => {
    expect(validateTemplateOptionDefinition(session, { id: 'key', type: 'choice' }, opts)).toEqual(
      undefined,
    );
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('choice type passes with choices', async () => {
    expect(
      validateTemplateOptionDefinition(
        session,
        { id: 'key', type: 'choice', choices: ['a', 'b'] },
        opts,
      ),
    ).toEqual({ id: 'key', type: 'choice', choices: ['a', 'b'] });
  });
  it('object with all properties passes', async () => {
    expect(
      validateTemplateOptionDefinition(
        session,
        {
          id: 'key',
          type: 'choice',
          choices: ['a', 'b'],
          description: 'desc',
          required: true,
          default: 'a',
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
      condition: {
        id: 'short_title',
        value: 'test',
      },
    });
    expect(opts.messages.errors?.length ?? 0).toEqual(0);
  });
  it('object with all properties passes', async () => {
    expect(
      validateTemplateOptionDefinition(
        session,
        {
          id: 'key',
          type: 'string',
          description: 'desc',
          required: true,
          max_chars: 10,
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'string',
      description: 'desc',
      required: true,
      max_chars: 10,
    });
    expect(opts.messages.errors?.length ?? 0).toEqual(0);
  });
  it('invalid choices errors', async () => {
    expect(
      validateTemplateOptionDefinition(
        session,
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
        session,
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
        session,
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
        session,
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
  it('basic min / max', async () => {
    expect(
      validateTemplateOptionDefinition(
        session,
        {
          id: 'key',
          type: 'number',
          min: 1,
          max: 5,
          integer: true,
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'number',
      min: 1,
      max: 5,
      integer: true,
    });
    expect(opts.messages.errors?.length ?? 0).toEqual(0);
  });
  it('basic min / max with bad default errors', async () => {
    expect(
      validateTemplateOptionDefinition(
        session,
        {
          id: 'key',
          type: 'number',
          min: 1,
          max: 5,
          integer: true,
          default: 6,
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'number',
      min: 1,
      max: 5,
      integer: true,
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('min / max flipped', async () => {
    expect(
      validateTemplateOptionDefinition(
        session,
        {
          id: 'key',
          type: 'number',
          min: 5,
          max: 1,
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'number',
      min: 1,
      max: 5,
    });
    expect(opts.messages.warnings?.length).toEqual(1);
  });
  it('cannot use choices when not a choice', async () => {
    expect(
      validateTemplateOptionDefinition(
        session,
        {
          id: 'key',
          type: 'number',
          choices: ['a', 'b'],
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'number',
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('cannot use integer on a string type', async () => {
    expect(
      validateTemplateOptionDefinition(
        session,
        {
          id: 'key',
          type: 'string',
          integer: true,
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      type: 'string',
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('condition with id passes', async () => {
    expect(
      validateTemplateOptionDefinition(
        session,
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
        session,
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
      session,
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
      session,
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
      session,
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
      session,
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
      session,
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
  it('valid part definition passes', async () => {
    expect(
      validateTemplatePartDefinition(
        {
          id: 'key',
          description: 'desc',
          required: true,
          plain: false,
          as_list: true,
          extra: 'ignored',
        },
        opts,
      ),
    ).toEqual({
      id: 'key',
      description: 'desc',
      required: true,
      plain: false,
      as_list: true,
    });
  });
});

describe('validateTemplateParts', () => {
  it('missing required part errors', async () => {
    expect(validateTemplateParts({}, [{ id: 'key', required: true }], {}, opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('missing optional part passes', async () => {
    expect(validateTemplateParts({}, [{ id: 'key' }], {}, opts)).toEqual({});
    expect(opts.messages.errors?.length).toBeFalsy();
  });
  it('required part with invalid type errors', async () => {
    expect(validateTemplateParts({ key: true }, [{ id: 'key', required: true }], {}, opts)).toEqual(
      {},
    );
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('required part as string passes', async () => {
    expect(
      validateTemplateParts({ key: 'part value' }, [{ id: 'key', required: true }], {}, opts),
    ).toEqual({ key: 'part value' });
    expect(opts.messages.errors?.length).toBeFalsy();
  });
  it('required part as list passes with part as_list', async () => {
    expect(
      validateTemplateParts(
        { key: ['part value'] },
        [{ id: 'key', required: true, as_list: true }],
        {},
        opts,
      ),
    ).toEqual({ key: ['part value'] });
    expect(opts.messages.errors?.length).toBeFalsy();
  });
  it('required part as string errors with part as_list', async () => {
    expect(
      validateTemplateParts(
        { key: 'part value' },
        [{ id: 'key', required: true, as_list: true }],
        {},
        opts,
      ),
    ).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('required part as list errors without part as_list', async () => {
    expect(
      validateTemplateParts({ key: ['part value'] }, [{ id: 'key', required: true }], {}, opts),
    ).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('max_chars applies to string', async () => {
    expect(
      validateTemplateParts(
        { key: 'abc' },
        [{ id: 'key', required: true, max_chars: 3 }],
        {},
        opts,
      ),
    ).toEqual({ key: 'abc' });
    expect(opts.messages.errors?.length).toBeFalsy();
  });
  it('max_chars errors on long string', async () => {
    expect(
      validateTemplateParts(
        { key: 'abcdef' },
        [{ id: 'key', required: true, max_chars: 3 }],
        {},
        opts,
      ),
    ).toEqual({ key: 'abcdef' });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('max_chars applies to each item in list', async () => {
    expect(
      validateTemplateParts(
        { key: ['abc', 'def'] },
        [{ id: 'key', required: true, as_list: true, max_chars: 3 }],
        {},
        opts,
      ),
    ).toEqual({ key: ['abc', 'def'] });
    expect(opts.messages.errors?.length).toBeFalsy();
  });
  it('max_chars errors if item is long', async () => {
    expect(
      validateTemplateParts(
        { key: ['abcdef'] },
        [{ id: 'key', required: true, as_list: true, max_chars: 3 }],
        {},
        opts,
      ),
    ).toEqual({ key: ['abcdef'] });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('max_words applies to string', async () => {
    expect(
      validateTemplateParts(
        { key: 'abc' },
        [{ id: 'key', required: true, max_words: 1 }],
        {},
        opts,
      ),
    ).toEqual({ key: 'abc' });
    expect(opts.messages.errors?.length).toBeFalsy();
  });
  it('max_words errors on long string', async () => {
    expect(
      validateTemplateParts(
        { key: 'abc def' },
        [{ id: 'key', required: true, max_words: 1 }],
        {},
        opts,
      ),
    ).toEqual({ key: 'abc def' });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('max_words applies to each item in list', async () => {
    expect(
      validateTemplateParts(
        { key: ['abc', 'def'] },
        [{ id: 'key', required: true, as_list: true, max_words: 1 }],
        {},
        opts,
      ),
    ).toEqual({ key: ['abc', 'def'] });
    expect(opts.messages.errors?.length).toBeFalsy();
  });
  it('max_words errors if item is long', async () => {
    expect(
      validateTemplateParts(
        { key: ['abc def'] },
        [{ id: 'key', required: true, as_list: true, max_words: 1 }],
        {},
        opts,
      ),
    ).toEqual({ key: ['abc def'] });
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validateTemplateYml', () => {
  it('invalid input errors', async () => {
    expect(validateTemplateYml(session, '', opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('empty object passes', async () => {
    expect(validateTemplateYml(session, { jtex: 'v1' }, opts)).toEqual({ myst: 'v1' });
  });
  it('minimal object passes', async () => {
    expect(
      validateTemplateYml(
        session,
        {
          myst: 'v1',
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
          style: {},
          options: [],
          parts: [],
          doc: [],
          packages: [],
          files: [],
        },
        opts,
      ),
    ).toEqual({
      myst: 'v1',
      title: 'test',
      description: 'test',
      version: '1.0.0',
      authors: [],
      license: {
        content: {
          free: true,
          id: 'MIT',
          osi: true,
          name: 'MIT License',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      tags: [],
      source: 'https://example.com',
      github: 'https://github.com/example/repo',
      thumbnail: 'thumb',
      build: {},
      style: {},
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
        session,
        {
          jtex: 'v1',
          build: '',
          style: '',
          options: [{ id: 'key' }],
          parts: [{}],
          doc: [{}],
          files: ['fake.txt'],
        },
        { ...opts, templateDir: '.' },
      ),
    ).toEqual({ myst: 'v1', options: [], parts: [], doc: [], files: ['fake.txt'] });
    expect(opts.messages.errors?.length).toEqual(6);
  });
});
