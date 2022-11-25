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
import { validateSiteFrontmatterKeys } from 'myst-frontmatter';
import { SITE_CONFIG_KEYS } from './types';
import type { SiteAction, SiteConfig, SiteNavFolder, SiteNavPage, SiteProject } from './types';

function validateUrlOrPath(input: any, opts: ValidationOptions) {
  const value = validateString(input, opts);
  if (!defined(value)) return undefined;
  // Validate simple relative path in project
  if (value.match('^(/[a-zA-Z0-9._-]+){1,2}$')) return value;
  const urlValue = validateUrl(value, { ...opts, suppressErrors: true });
  if (!urlValue) {
    return validationError(`invalid URL or relative path: ${value}`, opts);
  }
  return urlValue;
}

export function validateSiteProject(input: any, opts: ValidationOptions) {
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

export function validateSiteNavItem(
  input: any,
  opts: ValidationOptions,
): SiteNavPage | SiteNavFolder | undefined {
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
    return { title, children } as SiteNavFolder;
  }
  // validate as SiteNavItem
  const value = validateKeys(input, { required: ['title', 'url'] }, opts);
  if (value === undefined) return undefined;
  const title = validateString(value.title, incrementOptions('title', opts));
  const url = validateUrlOrPath(value.url, incrementOptions('url', opts));
  if (title === undefined || !url) return undefined;
  return { title, url } as SiteNavPage;
}

export function validateSiteAction(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(
    input,
    { required: ['title', 'url'], optional: ['static'] },
    opts,
  );
  if (value === undefined) return undefined;
  const title = validateString(value.title, incrementOptions('title', opts));
  if (defined(value.static)) {
    value.static = validateBoolean(value.static, incrementOptions('static', opts));
  }
  const actionUrlValidator = value.static ? validateString : validateUrlOrPath;
  const url = actionUrlValidator(value.url, incrementOptions('url', opts));
  if (title === undefined || !url) return undefined;
  return value as SiteAction;
}

export function validateSiteConfigKeys(
  value: Record<string, any>,
  opts: ValidationOptions,
): SiteConfig {
  const output: SiteConfig = validateSiteFrontmatterKeys(value, opts);
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
  if (defined(value.favicon)) {
    output.favicon = validateString(value.favicon, incrementOptions('favicon', opts));
  }
  if (defined(value.template)) {
    output.template = validateString(value.template, incrementOptions('template', opts));
  }
  return output;
}

export function validateSiteConfig(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, SITE_CONFIG_KEYS, {
    ...opts,
    returnInvalidPartial: true,
  });
  if (value === undefined) return undefined;
  return validateSiteConfigKeys(value, opts);
}
