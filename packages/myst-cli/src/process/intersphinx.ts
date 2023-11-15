import { Inventory } from 'intersphinx';
import { tic, isUrl } from 'myst-cli-utils';
import { RuleId, fileError } from 'myst-common';
import { VFile } from 'vfile';
import { castSession } from '../session/cache.js';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';
import { logMessagesFromVFile } from '../utils/logMessagesFromVFile.js';

export async function loadIntersphinx(
  session: ISession,
  opts: { projectPath: string; force?: boolean },
): Promise<Inventory[]> {
  const state = session.store.getState();
  const projectConfig = selectors.selectLocalProjectConfig(state, opts.projectPath);
  const configFile = selectors.selectLocalConfigFile(state, opts.projectPath);
  // A bit confusing here, references is the frontmatter, but those are `externalReferences`
  if (!projectConfig?.references || !configFile) return [];
  const vfile = new VFile();
  vfile.path = configFile;
  const cache = castSession(session);
  const references = Object.entries(projectConfig.references)
    .filter(([key, object]) => {
      if (isUrl(object.url)) return true;
      fileError(vfile, `${key} references is not a valid url: "${object.url}"`, {
        ruleId: RuleId.intersphinxReferencesResolve,
      });
      return false;
    })
    .map(([key, object]) => {
      if (!cache.$externalReferences[key] || opts.force) {
        cache.$externalReferences[key] = new Inventory({ id: key, path: object.url });
      }
      return cache.$externalReferences[key];
    })
    .filter((exists) => !!exists);
  await Promise.all(
    references.map(async (loader) => {
      if (loader._loaded) return;
      const toc = tic();
      try {
        await loader.load();
      } catch (error) {
        session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
        fileError(vfile, `Problem fetching references entry: ${loader.id} (${loader.path})`, {
          ruleId: RuleId.intersphinxReferencesResolve,
        });
        return null;
      }
      session.log.info(
        toc(`🏫 Read ${loader.numEntries} references links for "${loader.id}" in %s.`),
      );
    }),
  );
  logMessagesFromVFile(session, vfile);
  return references;
}
