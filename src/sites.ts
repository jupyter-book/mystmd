import {
  defined,
  incrementOptions,
  ValidationOptions,
  validateKeys,
  validateObject,
  validateObjectKeys,
  validateString,
  validateUrl,
  validateList,
  validateBoolean,
} from './utils/validators';
import { getDate } from './helpers';
import { ProjectId } from './projects';
import { BaseLinks, JsonObject } from './types';

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
  remote: string;
  slug: string;
  path?: string;
}

export interface SiteNavPage {
  title: string;
  url: string;
}

export interface SiteNavFolder {
  title: string;
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

export interface PartialSiteConfig {
  title?: string;
  description?: string;
  venue?: Venue;
  projects?: SiteProject[];
  nav?: (SiteNavPage | SiteNavFolder)[];
  actions?: SiteAction[];
  domains?: string[];
  twitter?: string;
  logo?: string;
  logoText?: string;
  favicon?: string;
  buildPath?: string;
  analytics?: SiteAnalytics;
  design?: SiteDesign;
}

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

export function createCurvespaceUrl(name: string, sub?: string | null): string {
  const url = sub ? `https://${name}-${sub}.curve.space` : `https://${name}.curve.space`;
  if (!isCurvespaceDomain(url)) throw new Error(`The url "${url}" is not valid`);
  return url;
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

/**
 * Validate Venue object against the schema
 *
 * If 'value' is a string, venue will be coerced to object { title: value }
 */
export function validateVenue(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: ['title', 'url'] }, opts);
  if (value === undefined) return undefined;
  const output: Venue = {};
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
  if (defined(value.url)) {
    output.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  return output;
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

export function validateSiteNavItem(
  input: any,
  opts: ValidationOptions,
): SiteNavPage | SiteNavFolder | undefined {
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
  const output: Record<string, any> = {};
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
  if (defined(value.description)) {
    output.description = validateString(value.description, incrementOptions('description', opts));
  }
  if (defined(value.venue)) {
    output.venue = validateVenue(value.venue, incrementOptions('venue', opts));
  }
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
  return output as PartialSiteConfig;
}
