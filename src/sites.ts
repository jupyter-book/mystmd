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
  created_by: string;
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
