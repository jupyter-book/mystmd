import fs from 'fs';
import JTex, { TemplateKinds } from 'jtex';
import { createNpmLogger, makeExecutable, tic } from 'myst-cli-utils';
import type { ISession } from '../../session/types';
import { selectors } from '../../store';
import type { Options } from './prepare';

const DEFAULT_SITE_TEMPLATE = 'https://github.com/curvenote/book-theme.git';
const DEFAULT_INSTALL_COMMAND = 'npm install';

export async function getJtex(session: ISession) {
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  const jtex = new JTex(session, {
    kind: TemplateKinds.site,
    template: siteConfig?.template ?? DEFAULT_SITE_TEMPLATE,
    buildDir: session.buildPath(),
  });
  return jtex;
}

export async function cloneSiteTemplate(session: ISession, opts: Options): Promise<void> {
  if (opts.ci) return;
  const jtex = await getJtex(session);
  if (opts.force) {
    fs.rmSync(jtex.templatePath, { recursive: true, force: true });
  } else if (opts.branch && opts.branch !== 'main') {
    throw new Error(
      `Cannot use --branch option without force cloning \n\nTry with options: -f --branch ${opts.branch}`,
    );
  }
  if (fs.existsSync(jtex.templatePath)) return;
  await jtex.ensureTemplateExistsOnPath();
  const toc = tic();
  session.log.info('⤵️  Installing web libraries (can take up to 60 s)');
  await makeExecutable(
    jtex.getValidatedTemplateYml().build?.install ?? DEFAULT_INSTALL_COMMAND,
    createNpmLogger(session),
    {
      cwd: jtex.templatePath,
    },
  )();
  session.log.info(toc('📦 Installed web libraries in %s'));
}
