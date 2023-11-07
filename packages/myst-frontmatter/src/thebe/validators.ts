import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateBoolean,
  validateObject,
  validateObjectKeys,
  validateString,
  validateUrl,
  validationError,
} from 'simple-validators';
import { GITHUB_USERNAME_REPO_REGEX } from '../utils/validators.js';
import type { BinderHubOptions, JupyterServerOptions, Thebe } from './types.js';

const THEBE_KEYS = [
  'lite',
  'binder',
  'server',
  'kernelName',
  'sessionName',
  'disableSessionSaving',
  'mathjaxUrl',
  'mathjaxConfig',
  'local',
];
const BINDER_HUB_OPTIONS_KEYS = ['url', 'ref', 'repo', 'provider'];
const JUPYTER_SERVER_OPTIONS_KEYS = ['url', 'token'];

/**
 * Validate Thebe options
 *
 * https://thebe-core.curve.space/docs-core/a-configuration
 */
export function validateThebe(input: any, opts: ValidationOptions): Thebe | undefined {
  if (input === false) return undefined;
  if (input === 'lite') return { lite: true };
  if (typeof input === 'string' && input !== 'binder') {
    return validationError(
      `thebe must be a boolean, an object, "lite" or "binder", not a string: ${input}`,
      opts,
    );
  }

  let inputObject: Record<string, any> = input;
  if (input === true || input === 'binder') {
    // expand boolean methods to object
    inputObject = { binder: true };
  }

  const value: Thebe | undefined = validateObjectKeys(inputObject, { optional: THEBE_KEYS }, opts);

  if (value === undefined) return undefined;
  const output: Thebe = {};
  if (defined(value.lite)) {
    output.lite = validateBoolean(value.lite, incrementOptions('lite', opts));
  }
  if (value.binder) {
    output.binder = validateBinderHubOptions(
      value.binder === true ? {} : (value.binder as BinderHubOptions),
      {
        ...incrementOptions('binder', opts),
        errorLogFn: (msg) =>
          validationError(msg.split('object').join('an object or boolean'), opts),
      },
    );
  }
  if (defined(value.server)) {
    const serverOpts = incrementOptions('server', opts);
    output.server = validateJupyterServerOptions(value.server, serverOpts);
  }
  if (defined(value.kernelName)) {
    output.kernelName = validateString(value.kernelName, incrementOptions('kernelName', opts));
  }
  if (defined(value.sessionName)) {
    output.sessionName = validateString(value.sessionName, incrementOptions('sessionName', opts));
  }
  if (defined(value.disableSessionSaving)) {
    output.disableSessionSaving = validateBoolean(
      value.disableSessionSaving,
      incrementOptions('disableSessionSaving', opts),
    );
  }
  if (defined(value.mathjaxUrl)) {
    output.mathjaxUrl = validateUrl(value.mathjaxUrl, incrementOptions('mathjaxUrl', opts));
  }
  if (defined(value.mathjaxConfig)) {
    output.mathjaxConfig = validateString(
      value.mathjaxConfig,
      incrementOptions('mathjaxConfig', opts),
    );
  }

  return output;
}

export function validateBinderHubOptions(input: BinderHubOptions, opts: ValidationOptions) {
  // input expected to be resolved to an object at this stage.
  // missing fields should be replaced by defaults
  const value = validateObjectKeys(input, { optional: BINDER_HUB_OPTIONS_KEYS }, opts);
  if (value === undefined) return undefined;

  const output: BinderHubOptions = {};

  output.url = validateUrl(value.url ?? 'https://mybinder.org/', incrementOptions('url', opts));

  // if there  is no provider, set it to github
  // if there is a provider, validate it as a non empty string
  output.provider = value.provider
    ? validateString(value.provider, {
        ...incrementOptions('provider', opts),
        regex: /.+/,
      })
    : 'github';

  // if our resolved provider is a git-like repo, we should validate repo and ref if
  // provided, otherwise we supply defaults
  if (output.provider?.match(/^(git|github|gitlab|gist)$/i)) {
    // first try to validate repo as a github username/repo string
    output.repo = value.repo
      ? validateString(value.repo, {
          ...incrementOptions('repo', opts),
          regex: GITHUB_USERNAME_REPO_REGEX,
          suppressErrors: true,
          suppressWarnings: true,
        })
      : 'executablebooks/thebe-binder-base';

    // then if not, validate as a url and report errors based on url validation
    // this will encourage use of fully qualified urls
    if (!output.repo) {
      output.repo = validateUrl(value.repo, incrementOptions('repo', opts));
    }

    // validate ref as a string
    output.ref = value.ref ? validateString(value.ref, incrementOptions('ref', opts)) : 'HEAD';
  } else {
    // we are in a custom provider and repo can be any string value, but must be present
    // -> validate as any non empty string
    // do not validate ref but ensure that is at least an empty string, to prevent thebe
    // from setting it to 'HEAD'

    // this ensures a non empty string
    output.repo = validateString(value.repo, {
      ...incrementOptions('repo', opts),
      regex: /.+/,
    });

    output.ref = value.ref ? validateString(value.ref, incrementOptions('ref', opts)) : '';
  }

  return output;
}

export function validateJupyterServerOptions(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { required: JUPYTER_SERVER_OPTIONS_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: JupyterServerOptions = {};
  if (defined(value.url)) {
    output.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  if (defined(value.token)) {
    output.token = validateString(value.token, incrementOptions('token', opts));
  }
  return output.url && output.token ? output : undefined;
}
