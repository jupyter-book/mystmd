import fs from 'fs';
import { join } from 'path';
import JTex, { TemplateKinds } from 'jtex';
import { createNpmLogger, makeExecutable, tic } from 'myst-cli-utils';
import type { ISession } from '../../session/types';
import { selectors } from '../../store';

const DEFAULT_SITE_TEMPLATE = 'https://github.com/curvenote/book-theme.git';
const DEFAULT_INSTALL_COMMAND = 'npm install';

export async function getJtex(session: ISession) {
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  const jtex = new JTex(session, {
    kind: TemplateKinds.site,
    template: siteConfig?.template ?? DEFAULT_SITE_TEMPLATE,
    buildDir: session.buildPath(),
  });
  await jtex.ensureTemplateExistsOnPath();
  return jtex;
}

export async function cloneSiteTemplate(session: ISession, jtex: JTex): Promise<void> {
  if (fs.existsSync(join(jtex.templatePath, 'node_modules'))) return;
  const toc = tic();
  session.log.info('⤵️ Installing web libraries (can take up to 60 s)');
  await makeExecutable(
    jtex.getValidatedTemplateYml().build?.install ?? DEFAULT_INSTALL_COMMAND,
    createNpmLogger(session),
    {
      cwd: jtex.templatePath,
    },
  )();
  session.log.info(toc('📦 Installed web libraries in %s'));
}
