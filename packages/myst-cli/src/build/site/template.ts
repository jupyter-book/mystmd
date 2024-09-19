import fs from 'node:fs';
import { join } from 'node:path';
import { RuleId, TemplateKind } from 'myst-common';
import { createNpmLogger, makeExecutable, tic } from 'myst-cli-utils';
import MystTemplate from 'myst-templates';
import type { ISession } from '../../session/types.js';
import { selectors } from '../../store/index.js';
import { addWarningForFile } from '../../utils/addWarningForFile.js';
import { castSession } from '../../session/cache.js';

const DEFAULT_TEMPLATE = 'book-theme';
const DEFAULT_INSTALL_COMMAND = 'npm install';

export async function getSiteTemplate(session: ISession, opts?: { defaultTemplate?: string }) {
  const cache = castSession(session);
  const state = cache.store.getState();
  if (cache.$siteTemplate) return cache.$siteTemplate;
  const siteConfig = selectors.selectCurrentSiteConfig(state);
  const file = selectors.selectCurrentSiteFile(state) ?? session.configFiles[0];
  const mystTemplate = new MystTemplate(session, {
    kind: TemplateKind.site,
    template: siteConfig?.template ?? opts?.defaultTemplate ?? DEFAULT_TEMPLATE,
    buildDir: session.buildPath(),
    errorLogFn: (message: string) => {
      addWarningForFile(session, file, message, 'error', {
        ruleId: RuleId.validSiteConfig,
      });
    },
    warningLogFn: (message: string) => {
      addWarningForFile(session, file, message, 'warn', {
        ruleId: RuleId.validSiteConfig,
      });
    },
  });
  await mystTemplate.ensureTemplateExistsOnPath();
  cache.$siteTemplate = mystTemplate;
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
