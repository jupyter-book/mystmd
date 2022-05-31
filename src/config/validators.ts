import { PROJECT_FRONTMATTER_KEYS, validateProjectFrontmatter } from '../frontmatter/validators';
import {
  defined,
  incrementOptions,
  Options,
  validateObject,
  validateKeys,
  validateString,
  validateUrl,
  validateList,
} from '../utils/validators';
import { ProjectConfig } from './types';

const PROJECT_CONFIG_KEYS = ['remote', 'index', 'exclude'].concat(PROJECT_FRONTMATTER_KEYS);

/**
 * Validate ProjectConfig object against the schema
 */
export function validateProjectConfig(input: any, opts: Options) {
  const projectFrontmatter = validateProjectFrontmatter(input, { ...opts, warn: false });
  let value = validateObject(input, opts);
  value = validateKeys(value, { optional: PROJECT_CONFIG_KEYS }, opts);
  if (defined(value.remote)) {
    value.remote = validateUrl(value.remote, {
      includes: 'curvenote.com',
      ...incrementOptions('remote', opts),
    });
  }
  if (defined(value.index)) {
    // TODO: Warn if these files don't exist
    value.index = validateString(value.index, incrementOptions('index', opts));
  }
  if (defined(value.exclude)) {
    const excludeOpts = incrementOptions('exclude', opts);
    value.exclude = validateList(value.exclude, excludeOpts).map((file) => {
      return validateString(file, excludeOpts);
    });
  }
  return { ...projectFrontmatter, ...value } as ProjectConfig;
}

function validateSiteProject(input: any, opts: Options) {}
function validateSiteNavItem(input: any, opts: Options) {}
function validateSiteAction(input: any, opts: Options) {}
function validateSiteConfig(input: any, opts: Options) {}
function validateConfig(input: any, opts: Options) {}
