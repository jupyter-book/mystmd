import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateKeys,
  validateObject,
  validateObjectKeys,
  validateString,
  validateSubdomain,
  validateUrl,
  validateList,
  validateBoolean,
  validationError,
} from 'simple-validators';
import {
  FRONTMATTER_ALIASES,
  SITE_FRONTMATTER_KEYS,
  validateSiteFrontmatterKeys,
} from 'myst-frontmatter';
import type { SiteAction, SiteConfig, SiteNavItem, SiteProject } from './types.js';

export const SITE_CONFIG_KEYS = {
  optional: [...SITE_FRONTMATTER_KEYS, 'projects', 'nav', 'actions', 'domains', 'template'],
  alias: FRONTMATTER_ALIASES,
};

function validateUrlOrPath(input: any, opts: ValidationOptions) {
  const value = validateString(input, opts);
  if (!defined(value)) return undefined;
  // Validate simple relative path in project
  if (value.match('^(/[a-zA-Z0-9._-]+)+$')) return value;
  const urlValue = validateUrl(value, { ...opts, suppressErrors: true });
  if (!urlValue) {
    return validationError(`invalid URL or relative path: ${value}`, opts);
  }
  return urlValue;
}

export function validateSiteProject(input: any, opts: ValidationOptions) {
  // While slug is not required on the type, it is required when validating the config
  // i.e. we may construct a SiteProject dynamically with no slug, but if the user
  // is explicitly defining a SiteProject, they must provide a slug.
  const value = validateObjectKeys(
    input,
    { required: ['slug'], optional: ['remote', 'path'] },
    opts,
  );
  if (value === undefined) return undefined;
  const slug = validateString(value.slug, {
    ...incrementOptions('slug', opts),
    regex: '^[a-zA-Z0-9._-]+$',
  });
  if (!slug) return undefined;
  const output: SiteProject = { slug };
  if (defined(value.path)) {
    output.path = validateString(value.path, incrementOptions('path', opts));
  }
  if (defined(value.remote)) {
    output.remote = validateString(value.remote, incrementOptions('remote', opts));
  }
  return output;
}

export function validateSiteNavItem(input: any, opts: ValidationOptions): SiteNavItem | undefined {
  if (validateObject(input, opts) === undefined) return undefined;
  if (defined(input.children)) {
    // validate as SiteNavFolder
    const value = validateKeys(input, { required: ['title', 'children'] }, opts);
    if (value === undefined) return undefined;
    const title = validateString(value.title, incrementOptions('title', opts));
    const children = validateList(
      value.children,
      incrementOptions('children', opts),
      (child: any, index: number) => {
        return validateSiteNavItem(child, incrementOptions(`children.${index}`, opts));
      },
    );
    if (title === undefined || !children) return undefined;
    return { title, children };
  }
  // validate as SiteNavItem
  const value = validateKeys(input, { required: ['title', 'url'] }, opts);
  if (value === undefined) return undefined;
  const title = validateString(value.title, incrementOptions('title', opts));
  const url = validateUrlOrPath(value.url, incrementOptions('url', opts));
  if (title === undefined || !url) return undefined;
  return { title, url };
}

export function validateSiteAction(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(
    input,
    { required: ['title', 'url'], optional: ['static'] },
    opts,
  );
  if (value === undefined) return undefined;
  const title = validateString(value.title, incrementOptions('title', opts));
  const url = validateString(value.url, incrementOptions('url', opts));
  if (!title || !url) return undefined;
  const output: SiteAction = { title, url };
  if (defined(value.static)) {
    output.static = validateBoolean(value.static, incrementOptions('static', opts));
  }
  return output;
}

export function validateSiteConfigKeys(
  value: Record<string, any>,
  opts: ValidationOptions,
): SiteConfig {
  const output: SiteConfig = validateSiteFrontmatterKeys(value, opts) || {};
  if (defined(value.projects)) {
    output.projects = validateList(
      value.projects,
      incrementOptions('projects', opts),
      (proj, index) => {
        return validateSiteProject(proj, incrementOptions(`projects.${index}`, opts));
      },
    );
  }
  if (defined(value.nav)) {
    output.nav = validateList(value.nav, incrementOptions('nav', opts), (item, index) => {
      return validateSiteNavItem(item, incrementOptions(`nav.${index}`, opts));
    });
  }
  if (defined(value.actions)) {
    output.actions = validateList(
      value.actions,
      incrementOptions('actions', opts),
      (action, index) => {
        return validateSiteAction(action, incrementOptions(`actions.${index}`, opts));
      },
    );
  }
  if (defined(value.domains)) {
    const domains = validateList(
      value.domains,
      incrementOptions('domains', opts),
      (domain, index) => {
        return validateSubdomain(domain, incrementOptions(`domains.${index}`, opts));
      },
    );
    if (domains) output.domains = [...new Set(domains)];
  }
  if (defined(value.template)) {
    output.template = validateString(value.template, incrementOptions('template', opts));
  }
  return output;
}

/**
 * Validate and return common, non-template attributes of SiteConfig
 */
export function validateSiteConfig(input: any, opts: ValidationOptions) {
  const valueAsObject = validateObject(input, opts);
  if (valueAsObject === undefined) return undefined;
  const value = validateKeys(valueAsObject, SITE_CONFIG_KEYS, {
    ...opts,
    returnInvalidPartial: true,
    // Template options will appear as extra keys here; no need for warnings.
    suppressWarnings: true,
  });
  if (value === undefined) return undefined;
  Object.keys(valueAsObject)
    .filter((key) => !SITE_CONFIG_KEYS.optional.includes(key))
    .forEach((key) => {
      if (value.options?.[key]) {
        opts.errorLogFn?.(`duplicate value for site option ${key}`);
      } else {
        opts.warningLogFn?.(`extra site options should be nested under "options" key: ${key}`);
        value.options = { ...value.options, [key]: valueAsObject[key] };
      }
    });
  return validateSiteConfigKeys(value, opts);
}
