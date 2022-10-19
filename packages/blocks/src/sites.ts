import type { SiteConfig } from 'myst-config';
import { validateSiteConfig } from 'myst-config';
import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  getDate,
  incrementOptions,
  validateString,
  validateSubdomain,
  validateList,
  validationError,
} from 'simple-validators';
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

export interface SiteConfigLinks extends BaseLinks {
  project: string;
  publish: string;
}

export type SiteConfigDTO = { [P in keyof SiteConfig]: SiteConfig[P] | null } & {
  id: ProjectId;
  date_created: Date;
  date_modified: Date;
  links: SiteConfigLinks;
};

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

export function siteConfigFromDTO(id: ProjectId, json: JsonObject): SiteConfigDTO {
  const validationOptions: ValidationOptions = {
    property: 'site',
    messages: {},
  };
  const siteConfig = validateSiteConfig(json, validationOptions);
  if (siteConfig && defined(siteConfig.domains)) {
    const domains = validateList(
      siteConfig.domains,
      incrementOptions('domains', validationOptions),
      (domain, index) => {
        return validateDomain(domain, incrementOptions(`domains.${index}`, validationOptions));
      },
    );
    if (domains) siteConfig.domains = [...new Set(domains)];
  }
  return {
    id,
    ...siteConfig,
    date_created: getDate(json.date_created),
    date_modified: getDate(json.date_modified),
    links: { ...json.links },
  };
}
