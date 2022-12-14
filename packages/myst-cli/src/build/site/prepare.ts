import fs from 'fs';
import { tic } from 'myst-cli-utils';
import type { ISession } from '../../session/types';
import { processSite } from '../../process/site';
import type { LinkTransformer } from 'myst-transforms';
import type { TransformFn } from '../../process';

export type Options = {
  strict?: boolean;
  headless?: boolean;
  checkLinks?: boolean;
  yes?: boolean;
  writeToc?: boolean;
  keepHost?: boolean;
  extraLinkTransformers?: LinkTransformer[];
  extraTransforms?: TransformFn[];
  defaultTemplate?: string;
};

export function cleanSiteContent(session: ISession, info = true): void {
  const toc = tic();
  fs.rmSync(session.sitePath(), { recursive: true, force: true });
  if (info) {
    session.log.info(toc('🧹 Clean build content in %s.'));
  } else {
    session.log.debug(toc('🧹 Clean build content in %s.'));
  }
}

export function ensureBuildFoldersExist(session: ISession): void {
  // This also creates the site directory!
  fs.mkdirSync(session.contentPath(), { recursive: true });
  fs.mkdirSync(session.staticPath(), { recursive: true });
  session.log.debug(`Build folders created for site content: ${session.sitePath()}`);
}

export async function buildSite(session: ISession, opts: Options) {
  const { writeToc, strict, checkLinks, extraLinkTransformers, extraTransforms, defaultTemplate } =
    opts;
  ensureBuildFoldersExist(session);
  await processSite(session, {
    writeToc,
    strict,
    checkLinks,
    extraLinkTransformers,
    extraTransforms,
    defaultTemplate,
  });
}
