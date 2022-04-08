import { ExportableFormatTypes } from '@curvenote/blocks';

/** Maybe this is the new sections in the future?
 *
 * routes:
 *   - url: /2021
 *     file: index/2021.md
 *   - url: /2021/inversion/*
 *     folder: 2021/inversion
 *
 * export type Route = {
 *   url: string;
 *   file?: string;
 *   folder?: string;
 * };
 */

export type NavItem = {
  title: string;
  url: string;
  children?: Omit<NavItem, 'children'>[]; // Only one deep
};

export interface WebConfig {
  name: string;
  nav: NavItem[];
  sections: { title: string; folder: string; path: string }[];
  actions: { title: string; url: string; static?: boolean }[];
  favicon?: string | null;
  logo?: string | null;
  logoText?: string | null;
  design?: {
    hideAuthors?: boolean;
  };
  /** Domain hostname, for example, docs.curve.space or docs.curvenote.com */
  domains?: string[];
  /** Twitter handle for the site (not the article) */
  twitter?: string | null;
}

export interface ExportConfig {
  name: string;
  kind: ExportableFormatTypes;
  project: string;
  folder: string;
  filename?: string;
  template?: string;
  templatePath?: string;
  contents: { name?: string; link?: string; version?: number }[];
  data: {
    title?: string;
    short_title?: string;
    description?: string;
    date?: string;
    authors: {
      name?: string;
      id?: string;
      corresponding?: boolean;
      email?: string;
    }[];
  } & Record<string, any>;
}

export interface SyncConfig {
  id: string; // ProjectId
  folder: string; // Local folder
  link: string; // Project Link
}

export const CONFIG_VERSION = 1;

export interface CurvenoteConfig {
  version: number;
  sync: SyncConfig[];
  web: WebConfig;
  export?: ExportConfig[];
}
