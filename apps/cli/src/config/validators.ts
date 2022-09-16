import {
  PROJECT_FRONTMATTER_KEYS,
  SITE_FRONTMATTER_KEYS,
  validateProjectFrontmatterKeys,
  validateSiteFrontmatterKeys,
} from 'myst-frontmatter';
import type { ValidationOptions } from '@curvenote/validators';
import {
  defined,
  incrementOptions,
  validateKeys,
  validateObject,
  validateObjectKeys,
  validateString,
  validateUrl,
  validateList,
  validateBoolean,
} from '@curvenote/validators';
import type {
  ProjectConfig,
  SiteAction,
  SiteAnalytics,
  SiteConfig,
  SiteDesign,
  SiteNavFolder,
  SiteNavItem,
  SiteNavPage,
  SiteProject,
} from './types';

const PROJECT_CONFIG_KEYS = {
  optional: ['remote', 'index', 'exclude'].concat(PROJECT_FRONTMATTER_KEYS),
};
const SITE_CONFIG_KEYS = {
  required: ['projects', 'nav', 'actions', 'domains'],
  optional: ['twitter', 'logo', 'logoText', 'favicon', 'buildPath', 'analytics', 'design'].concat(
    SITE_FRONTMATTER_KEYS,
  ),
};

function validateProjectConfigKeys(value: Record<string, any>, opts: ValidationOptions) {
  const output: ProjectConfig = validateProjectFrontmatterKeys(value, opts);
  if (defined(value.remote)) {
    // TODO: Validate as oxa? Or curvenote url...?
    output.remote = validateString(value.remote, incrementOptions('remote', opts));
  }
  if (defined(value.index)) {
    // TODO: Warn if these files don't exist
    output.index = validateString(value.index, incrementOptions('index', opts));
  }
  if (defined(value.exclude)) {
    output.exclude = validateList(
      value.exclude,
      incrementOptions('exclude', opts),
      (file, index: number) => {
        return validateString(file, incrementOptions(`exclude.${index}`, opts));
      },
    );
  }
  return output;
}

/**
 * Validate ProjectConfig object against the schema
 */
export function validateProjectConfig(input: any, opts: ValidationOptions): ProjectConfig {
  const value = validateObjectKeys(input, PROJECT_CONFIG_KEYS, opts) || {};
  return validateProjectConfigKeys(value, opts);
}

export function validateSiteProject(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { required: ['path', 'slug'] }, opts);
  if (value === undefined) return undefined;
  const path = validateString(value.path, incrementOptions('path', opts));
  const slug = validateString(value.slug, {
    ...incrementOptions('slug', opts),
    regex: '^[a-zA-Z0-9._-]+$',
  });
  if (!path || !slug) return undefined;
  return { path, slug } as SiteProject;
}

export function validateSiteNavItem(input: any, opts: ValidationOptions): SiteNavItem | undefined {
  let value = validateObject(input, opts);
  if (value === undefined) return undefined;
  if (defined(value.children)) {
    // validate as SiteNavFolder
    value = validateKeys(value, { required: ['title', 'children'] }, opts);
    if (value === undefined) return undefined;
    const title = validateString(value.title, incrementOptions('title', opts));
    const children = validateList(
      value.children,
      incrementOptions('children', opts),
      (child, index) => {
        return validateSiteNavItem(child, incrementOptions(`children.${index}`, opts));
      },
    );
    if (title === undefined || !children) return undefined;
    return { title, children } as SiteNavFolder;
  }
  // validate as SiteNavItem
  value = validateKeys(value, { required: ['title', 'url'] }, opts);
  if (value === undefined) return undefined;
  const title = validateString(value.title, incrementOptions('title', opts));
  const url = validateString(value.url, {
    ...incrementOptions('url', opts),
    regex: '^(/[a-zA-Z0-9._-]+){1,2}$',
  });
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
  const actionUrlValidator = value.static ? validateString : validateUrl;
  const url = actionUrlValidator(value.url, incrementOptions('url', opts));
  if (title === undefined || !url) return undefined;
  return value as SiteAction;
}

export function validateSiteDesign(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: ['hide_authors'] }, opts);
  if (value === undefined) return undefined;
  if (defined(value.hide_authors)) {
    value.hide_authors = validateBoolean(
      value.hide_authors,
      incrementOptions('hide_authors', opts),
    );
  }
  return value as SiteDesign;
}

export function validateSiteAnalytics(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: ['google', 'plausible'] }, opts);
  if (value === undefined) return undefined;
  if (defined(value.google)) {
    value.google = validateString(value.google, incrementOptions('google', opts));
  }
  if (defined(value.plausible)) {
    value.plausible = validateString(value.plausible, incrementOptions('plausible', opts));
  }
  return value as SiteAnalytics;
}

export function validateSiteConfigKeys(value: Record<string, any>, opts: ValidationOptions) {
  const output: Record<string, any> = validateSiteFrontmatterKeys(value, opts);
  if (defined(value.projects)) {
    output.projects = validateList(
      value.projects,
      incrementOptions('projects', opts),
      (proj, index) => {
        return validateSiteProject(proj, incrementOptions(`projects.${index}`, opts));
      },
    );
  } else {
    output.projects = [];
  }
  if (defined(value.nav)) {
    output.nav = validateList(value.nav, incrementOptions('nav', opts), (item, index) => {
      return validateSiteNavItem(item, incrementOptions(`nav.${index}`, opts));
    });
  } else {
    output.nav = [];
  }
  if (defined(value.actions)) {
    output.actions = validateList(
      value.actions,
      incrementOptions('actions', opts),
      (action, index) => {
        return validateSiteAction(action, incrementOptions(`actions.${index}`, opts));
      },
    );
  } else {
    output.actions = [];
  }
  if (defined(value.domains)) {
    const domainsOpts = incrementOptions('domains', opts);
    output.domains = validateList(value.domains, domainsOpts, (domain) => {
      // Very basic subdomain validation
      return validateString(domain, { ...domainsOpts, regex: /^.+\..+\..+$/ });
    });
  } else {
    output.domains = [];
  }
  if (defined(value.twitter)) {
    output.twitter = validateString(value.twitter, {
      ...incrementOptions('twitter', opts),
      regex: /^@?(\w){1,15}$/,
    });
  }
  if (defined(value.logo)) {
    output.logo = validateString(value.logo, incrementOptions('logo', opts));
  }
  if (defined(value.logoText)) {
    output.logoText = validateString(value.logoText, incrementOptions('logoText', opts));
  }
  if (defined(value.favicon)) {
    output.favicon = validateString(value.favicon, incrementOptions('favicon', opts));
  }
  if (defined(value.buildPath)) {
    output.buildPath = validateString(value.buildPath, incrementOptions('buildPath', opts));
  }
  if (defined(value.analytics)) {
    output.analytics = validateSiteAnalytics(value.analytics, incrementOptions('analytics', opts));
  }
  if (defined(value.design)) {
    output.design = validateSiteDesign(value.design, incrementOptions('design', opts));
  }
  if (!output.projects || !output.nav || !output.actions || !output.domains) return undefined;
  return output as SiteConfig;
}

export function validateSiteConfig(input: any, opts: ValidationOptions) {
  const value =
    validateObjectKeys(input, SITE_CONFIG_KEYS, { ...opts, returnInvalidPartial: true }) || {};
  return validateSiteConfigKeys(value, opts);
}
