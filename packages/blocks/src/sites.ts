import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  getDate,
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
  validationWarning,
} from 'simple-validators';
import type { SiteFrontmatter } from 'myst-frontmatter';
import { SITE_FRONTMATTER_KEYS, validateSiteFrontmatterKeys } from 'myst-frontmatter';
import type { ProjectId } from './projects';
import type { BaseLinks, JsonObject } from './types';

export interface UploadFileInfo {
  path: string;
  content_type: string;
  md5: string;
  size: number;
}

export interface SiteUploadRequest {
  files: UploadFileInfo[];
}

export interface FileUploadResponse extends UploadFileInfo {
  signed_url: string;
}

export interface SiteUploadResponse {
  id: string;
  bucket: string;
  /** The *original* path is the key */
  files: Record<string, FileUploadResponse>;
}

export interface SiteDeployRequest {
  id: string;
  files: { path: string }[];
}

export interface DnsRouter {
  /** The subdomain of the router */
  id: string;
  cdn: string;
  created_by: string;
  date_created: Date;
  date_modified: Date;
}

export interface Venue {
  title?: string;
  url?: string;
}

export interface SiteProject {
  slug: string;
  remote?: string;
  path?: string;
}

export interface SiteNavPage {
  title: string;
  url: string;
  internal?: boolean;
}

export interface SiteNavFolder {
  title: string;
  url?: string;
  children: (SiteNavPage | SiteNavFolder)[];
}

export interface SiteAction extends SiteNavPage {
  static?: boolean;
}

export interface SiteAnalytics {
  google?: string;
  plausible?: string;
}

export interface SiteDesign {
  hide_authors?: boolean;
}

export const SITE_CONFIG_KEYS = {
  optional: [
    'projects',
    'nav',
    'actions',
    'domains',
    'twitter',
    'logo',
    'logo_text',
    'logoText',
    'favicon',
    'analytics',
    'design',
  ].concat(SITE_FRONTMATTER_KEYS),
};

export type PartialSiteConfig = SiteFrontmatter & {
  projects?: SiteProject[];
  nav?: (SiteNavPage | SiteNavFolder)[];
  actions?: SiteAction[];
  domains?: string[];
  twitter?: string;
  logo?: string;
  logo_text?: string;
  favicon?: string;
  analytics?: SiteAnalytics;
  design?: SiteDesign;
};

export interface SiteConfigLinks extends BaseLinks {
  project: string;
  publish: string;
}

export interface SiteConfig extends PartialSiteConfig {
  id: ProjectId;
  date_created: Date;
  date_modified: Date;
  links: SiteConfigLinks;
}

const CURVE_SPACE = /^(?:(?:https?:)?\/\/)?([a-z0-9_]{3,20})(?:-([a-z0-9_]{1,30}))?\.curve\.space$/;

/**
 * Test if the string is a valid curvespace domain.
 *
 * For example: `https://some.curve.space`
 *
 * @param test the URL to test
 * @returns
 */
export function isCurvespaceDomain(test: string): boolean {
  if (!test) return false;
  return !!test.match(CURVE_SPACE);
}

/**
 * Extract the information from a valid curvespace domain.
 * There is one subdomain per team/user, with an optional sub-site,
 * which is sparated by a `-`.
 *
 * For example:
 *  - `username.curve.space`
 *  - `username-mysite.curve.space`
 *
 * Usernames and sites can include
 *
 * @param test the URL to test
 * @returns
 */
export function getCurvespaceParts(test: string): [string | null, string | null] {
  const match = test.match(CURVE_SPACE);
  if (!match) return [null, null];
  return [match[1], match[2] ?? null];
}

export function createCurvespaceDomain(name: string, sub?: string | null): string {
  const url = (sub ? `${name}-${sub}.curve.space` : `${name}.curve.space`).toLowerCase();
  if (!isCurvespaceDomain(url)) throw new Error(`The domain "${url}" is not valid`);
  return url;
}

export function createCurvespaceUrl(name: string, sub?: string | null): string {
  return `https://${createCurvespaceDomain(name, sub)}`;
}

export function dnsRouterFromDTO(id: string, json: JsonObject): DnsRouter {
  return {
    id,
    cdn: json.cdn ?? '',
    created_by: json.created_by ?? '',
    date_created: getDate(json.date_created),
    date_modified: getDate(json.date_modified),
  };
}

export function validateDomain(input: any, opts: ValidationOptions) {
  const value = validateString(input, opts);
  if (!defined(value)) return undefined;
  const lowerCase = value.toLowerCase();
  const [name, sub] = getCurvespaceParts(lowerCase as string);
  if (name) return createCurvespaceDomain(name, sub);
  if (lowerCase.endsWith('.curve.space')) {
    return validationError(`invalid *.curve.space domain: ${input}`, opts);
  }
  return validateSubdomain(lowerCase as string, opts);
}

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

export function validateSiteConfigKeys(
  value: Record<string, any>,
  opts: ValidationOptions,
): PartialSiteConfig {
  const output: PartialSiteConfig = validateSiteFrontmatterKeys(value, opts);
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
        return validateDomain(domain, incrementOptions(`domains.${index}`, opts));
      },
    );
    if (domains) output.domains = [...new Set(domains)];
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
  if (defined(value.logo_text)) {
    output.logo_text = validateString(value.logo_text, incrementOptions('logo_text', opts));
  } else if (defined(value.logoText)) {
    validationWarning('logoText is deprecated, please use logo_text', opts);
    output.logo_text = validateString(value.logoText, incrementOptions('logoText', opts));
  }
  if (defined(value.favicon)) {
    output.favicon = validateString(value.favicon, incrementOptions('favicon', opts));
  }
  if (defined(value.analytics)) {
    output.analytics = validateSiteAnalytics(value.analytics, incrementOptions('analytics', opts));
  }
  if (defined(value.design)) {
    output.design = validateSiteDesign(value.design, incrementOptions('design', opts));
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

export function siteConfigFromDTO(id: ProjectId, json: JsonObject): SiteConfig {
  const validationOptions: ValidationOptions = {
    property: 'site',
    messages: {},
  };
  return {
    id,
    ...validateSiteConfig(json, validationOptions),
    date_created: getDate(json.date_created),
    date_modified: getDate(json.date_modified),
    links: { ...json.links },
  };
}
