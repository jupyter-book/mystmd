import fs from 'fs';
import { join } from 'path';
import type { SiteConfig } from 'myst-config';
import { TemplateKind } from 'myst-common';
import { createNpmLogger, makeExecutable, tic } from 'myst-cli-utils';
import MystTemplate from 'myst-templates';
import type { ISession } from '../../session/types';
import { selectors } from '../../store';

const DEFAULT_SINGLE_PROJ_TEMPLATE = 'article-theme';
const DEFAULT_MULTI_PROJ_TEMPLATE = 'book-theme';
const DEFAULT_INSTALL_COMMAND = 'npm install';

function isSingleProject(siteConfig?: SiteConfig): boolean {
  if (!siteConfig?.projects || (siteConfig.projects.length === 1 && !siteConfig.projects[0].slug)) {
    return true;
  }
  return false;
}

export async function getMystTemplate(session: ISession, opts?: { defaultTemplate?: string }) {
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  const defaultTemplate = isSingleProject(siteConfig)
    ? DEFAULT_SINGLE_PROJ_TEMPLATE
    : DEFAULT_MULTI_PROJ_TEMPLATE;
  const mystTemplate = new MystTemplate(session, {
    kind: TemplateKind.site,
    template: siteConfig?.template ?? opts?.defaultTemplate ?? defaultTemplate,
    buildDir: session.buildPath(),
  });
  await mystTemplate.ensureTemplateExistsOnPath();
  return mystTemplate;
}

export async function installSiteTemplate(
  session: ISession,
  mystTemplate: MystTemplate,
): Promise<void> {
  if (fs.existsSync(join(mystTemplate.templatePath, 'node_modules'))) return;
  const toc = tic();
  session.log.info('⤵️  Installing web libraries (can take up to 60 s)');
  await makeExecutable(
    mystTemplate.getValidatedTemplateYml().build?.install ?? DEFAULT_INSTALL_COMMAND,
    createNpmLogger(session),
    {
      cwd: mystTemplate.templatePath,
    },
  )();
  session.log.info(toc('📦 Installed web libraries in %s'));
}
