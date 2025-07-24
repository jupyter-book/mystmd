import { RuleId, TemplateKind } from 'myst-common';
import MystTemplate from 'myst-templates';
import type { ISession } from '../../session/types.js';
import { selectors } from '../../store/index.js';
import { addWarningForFile } from '../../utils/addWarningForFile.js';
import { castSession } from '../../session/cache.js';
import { DEFAULT_TEMPLATE } from '../../templates/site.js';

export async function getSiteTemplate(
  session: ISession,
  opts?: { template?: string; defaultTemplate?: string },
) {
  const cache = castSession(session);
  const state = cache.store.getState();
  if (cache.$siteTemplate) return cache.$siteTemplate;
  const siteConfig = selectors.selectCurrentSiteConfig(state);
  const file = selectors.selectCurrentSiteFile(state) ?? session.configFiles[0];
  const mystTemplate = new MystTemplate(session, {
    kind: TemplateKind.site,
    template: opts?.template ?? siteConfig?.template ?? opts?.defaultTemplate ?? DEFAULT_TEMPLATE,
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
    validateFiles: opts?.template ? false : true,
  });
  await mystTemplate.ensureTemplateExistsOnPath();
  cache.$siteTemplate = mystTemplate;
  return mystTemplate;
}
