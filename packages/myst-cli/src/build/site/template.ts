import fs from 'fs';
import { join } from 'path';
import { createNpmLogger, makeExecutable, tic } from 'myst-cli-utils';
import MystTemplate, { TemplateKinds } from 'myst-templates';
import type { ISession } from '../../session/types';
import { selectors } from '../../store';

const DEFAULT_SITE_TEMPLATE = 'https://github.com/curvenote/book-theme.git';
const DEFAULT_INSTALL_COMMAND = 'npm install';

export async function getMystTemplate(session: ISession) {
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  const mystTemplate = new MystTemplate(session, {
    kind: TemplateKinds.site,
    template: siteConfig?.template ?? DEFAULT_SITE_TEMPLATE,
    buildDir: session.buildPath(),
  });
  await mystTemplate.ensureTemplateExistsOnPath();
  return mystTemplate;
}

export async function cloneSiteTemplate(
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
