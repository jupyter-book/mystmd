import { beforeEach, describe, expect, test } from 'vitest';
import type { Thebe } from './types';
import { validateThebe } from './validators';
import type { ValidationOptions } from 'simple-validators';

const TEST_THEBE: Thebe = {
  lite: false,
  binder: {
    url: 'https://my.binder.org/blah',
    ref: 'HEAD',
    repo: 'my-org/my-repo',
    provider: 'github',
  },
  server: {
    url: 'https://my.server.org',
    token: 'legit-secret',
  },
  kernelName: 'python3',
  sessionName: 'some-path',
  disableSessionSaving: true,
  mathjaxConfig: 'TeX-AMS_CHTML-full,Safe',
  mathjaxUrl: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js',
};

let opts: ValidationOptions;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
});

describe('validateThebe', () => {
  test('empty object returns self', async () => {
    expect(validateThebe({}, opts)).toEqual({});
  });
  test('extra keys removed', async () => {
    expect(validateThebe({ extra: '' }, opts)).toEqual({});
  });
  test('full object returns self', async () => {
    expect(validateThebe(TEST_THEBE, opts)).toEqual(TEST_THEBE);
  });
  test('custom provider accepts url as repo value', async () => {
    const output = validateThebe(
      {
        ...TEST_THEBE,
        binder: {
          url: 'https://binder.curvenote.com/services/binder/',
          repo: 'https://curvenote.com/sub/bundle.zip',
          provider: 'custom',
        },
      },
      opts,
    );
    expect(output?.binder).toEqual({
      url: 'https://binder.curvenote.com/services/binder/',
      repo: 'https://curvenote.com/sub/bundle.zip',
      provider: 'custom',
    });
  });
  test('errors if no repo with custom provider', async () => {
    expect(opts.messages).toEqual({});
    expect(
      validateThebe(
        {
          ...TEST_THEBE,
          binder: {
            url: 'https://binder.curvenote.com/services/binder/',
            provider: 'custom',
          },
        },
        opts,
      ),
    ).toEqual({
      ...TEST_THEBE,
      binder: {
        url: 'https://binder.curvenote.com/services/binder/',
        provider: 'custom',
      },
    });
    expect(opts.messages.errors?.length).toEqual(1);
    expect(opts.messages.errors?.[0].property).toEqual('repo');
  });
  test('thebe: "server" is not valid', async () => {
    expect(opts.messages).toEqual({});
    expect(validateThebe('server', opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
    expect(opts.messages.errors?.[0].property).toEqual('test');
  });
  test('thebe.server must be an object', async () => {
    expect(opts.messages).toEqual({});
    expect(validateThebe({ server: true }, opts)).toEqual({ server: undefined });
    expect(opts.messages.errors?.length).toEqual(1);
    expect(opts.messages.errors?.[0].property).toEqual('server');
  });
  test('thebe.server must have url and token fields - empty', async () => {
    expect(opts.messages).toEqual({});
    expect(validateThebe({ server: {} }, opts)).toEqual({ server: undefined });
    expect(opts.messages.errors?.length).toEqual(1);
    expect(opts.messages.errors?.[0].property).toEqual('server');
  });
  test('thebe.server must have url and token fields - no url', async () => {
    expect(opts.messages).toEqual({});
    expect(validateThebe({ server: { token: 'my-secret-secret' } }, opts)).toEqual({
      server: undefined,
    });
    expect(opts.messages.errors?.length).toEqual(1);
    expect(opts.messages.errors?.[0].property).toEqual('server');
  });
  test('thebe.server must have url and token fields - not a url string', async () => {
    expect(opts.messages).toEqual({});
    expect(
      validateThebe({ server: { url: 'not-a-url', token: 'my-secret-secret' } }, opts),
    ).toEqual({
      server: undefined,
    });
    expect(opts.messages.errors?.length).toEqual(1);
    expect(opts.messages.errors?.[0].property).toEqual('url');
  });
  test('thebe.server must have url and token fields - no token', async () => {
    expect(opts.messages).toEqual({});
    expect(validateThebe({ server: { url: 'http://localhost:9090' } }, opts)).toEqual({
      server: undefined,
    });
    expect(opts.messages.errors?.length).toEqual(1);
    expect(opts.messages.errors?.[0].property).toEqual('server');
  });
});
