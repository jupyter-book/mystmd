import { Inventory } from 'intersphinx';
import { tic, isUrl } from 'myst-cli-utils';
import type { ISession } from '../session/types.js';
import { castSession } from '../session/index.js';
import { selectors } from '../store/index.js';

export async function loadIntersphinx(
  session: ISession,
  opts: { projectPath: string; force?: boolean },
): Promise<Inventory[]> {
  const projectConfig = selectors.selectLocalProjectConfig(
    session.store.getState(),
    opts.projectPath,
  );
  const cache = castSession(session);
  // A bit confusing here, references is the frontmatter, but those are `externalReferences`
  if (!projectConfig?.references) return [];
  const references = Object.entries(projectConfig.references)
    .filter(([key, object]) => {
      if (isUrl(object.url)) return true;
      session.log.error(`⚠️  ${key} references is not a valid url: "${object.url}"`);
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
        session.log.error(`Problem fetching references entry: ${loader.id} (${loader.path})`);
        return null;
      }
      session.log.info(
        toc(`🏫 Read ${loader.numEntries} references links for "${loader.id}" in %s.`),
      );
    }),
  );
  return references;
}
