import { PROJECT_FRONTMATTER_KEYS, SITE_FRONTMATTER_KEYS } from '../frontmatter/validators';
import {
  defined,
  incrementOptions,
  Options,
  validateKeys,
  validateObject,
  validateObjectKeys,
  validateString,
  validateUrl,
  validateList,
  validateBoolean,
} from '../utils/validators';
import {
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

function validateProjectConfigKeys(value: Record<string, any>, opts: Options) {
  const output: ProjectConfig = {};
  if (defined(value.remote)) {
    output.remote = validateUrl(value.remote, {
      includes: 'curvenote.com',
      ...incrementOptions('remote', opts),
    });
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
export function validateProjectConfig(input: any, opts: Options) {
  const value = validateObjectKeys(input, PROJECT_CONFIG_KEYS, opts) || {};
  const projectConfig = validateProjectConfigKeys(value, opts);
  return projectConfig;
}

export function validateSiteProject(input: any, opts: Options) {
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

export function validateSiteNavItem(input: any, opts: Options): SiteNavItem | undefined {
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

export function validateSiteAction(input: any, opts: Options) {
  const value = validateObjectKeys(
    input,
    { required: ['title', 'url'], optional: ['static'] },
    opts,
  );
  if (value === undefined) return undefined;
  const title = validateString(value.title, incrementOptions('title', opts));
  const url = validateUrl(value.url, incrementOptions('url', opts));
  if (defined(value.static)) {
    value.static = validateBoolean(value.static, incrementOptions('static', opts));
  }
  if (title === undefined || !url) return undefined;
  return value as SiteAction;
}

export function validateSiteDesign(input: any, opts: Options) {
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

export function validateSiteAnalytics(input: any, opts: Options) {
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

export function validateSiteConfigKeys(value: Record<string, any>, opts: Options) {
  const output: Record<string, any> = {};
  const projects = validateList(
    value.projects,
    incrementOptions('projects', opts),
    (proj, index) => {
      return validateSiteProject(proj, incrementOptions(`projects.${index}`, opts));
    },
  );
  const nav = validateList(value.nav, incrementOptions('nav', opts), (item, index) => {
    return validateSiteNavItem(item, incrementOptions(`nav.${index}`, opts));
  });
  const actions = validateList(
    value.actions,
    incrementOptions('actions', opts),
    (action, index) => {
      return validateSiteAction(action, incrementOptions(`actions.${index}`, opts));
    },
  );
  const domainsOpts = incrementOptions('domains', opts);
  const domains = validateList(value.domains, domainsOpts, (domain) => {
    // Very basic subdomain validation
    return validateString(domain, { ...domainsOpts, regex: /^.+\..+\..+$/ });
  });
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
  if (!projects || !nav || !actions || !domains) return undefined;
  return { projects, nav, actions, domains, ...output } as SiteConfig;
}

export function validateSiteConfig(input: any, opts: Options) {
  const value = validateObjectKeys(input, SITE_CONFIG_KEYS, opts);
  if (value === undefined) return undefined;
  const siteConfig = validateSiteConfigKeys(value, opts);
  return siteConfig;
}
