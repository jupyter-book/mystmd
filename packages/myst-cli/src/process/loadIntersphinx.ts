import fs from 'node:fs';
import { join } from 'node:path';
import { Inventory } from 'intersphinx';
import { tic, isUrl, computeHash } from 'myst-cli-utils';
import { RuleId, fileError } from 'myst-common';
import { VFile } from 'vfile';
import { castSession } from '../session/cache.js';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';
import { logMessagesFromVFile } from '../utils/logging.js';

function inventoryCacheFile(session: ISession, id?: string, path?: string) {
  const hashcontent = `${id}${path}`;
  const filename = `intersphinx-${computeHash(hashcontent)}.inv`;
  const cacheFolder = join(session.buildPath(), 'cache');
  if (!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder, { recursive: true });
  return join(cacheFolder, filename);
}

/**
 * Load an array of intersphinx inventories defined in the project frontmatter
 *
 * @param session session with logging
 * @param opts loading options
 */
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
  const references = await Promise.all(
    Object.entries(projectConfig.references)
      .filter(([key, object]) => {
        if (isUrl(object.url)) return true;
        fileError(vfile, `${key} references is not a valid url: "${object.url}"`, {
          ruleId: RuleId.intersphinxReferencesResolve,
        });
        return false;
      })
      .map(async ([key, object]) => {
        if (!cache.$externalReferences[key] || opts.force) {
          const inventory = new Inventory({ id: key, path: object.url });
          const cachePath = inventoryCacheFile(session, key, inventory.path);
          if (fs.existsSync(cachePath) && !opts.force) {
            const localInventory = new Inventory({ id: key, path: cachePath });
            session.log.debug(`Loading cached inventory file for ${inventory.path}: ${cachePath}`);
            const toc = tic();
            await localInventory.load();
            inventory.project = localInventory.project;
            inventory.version = localInventory.version;
            inventory.data = localInventory.data;
            inventory._loaded = true;
            session.log.info(
              toc(`🏫 Read ${inventory.numEntries} references links for "${inventory.id}" in %s.`),
            );
          }
          cache.$externalReferences[key] = inventory;
        }
        return cache.$externalReferences[key];
      })
      .filter((exists) => !!exists),
  );
  await Promise.all(
    references.map(async (loader) => {
      if (loader._loaded) return;
      const toc = tic();
      try {
        session.log.debug(`Loading inventory file ${loader.path}`);
        await loader.load();
      } catch (error) {
        session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
        fileError(vfile, `Problem fetching references entry: ${loader.id} (${loader.path})`, {
          ruleId: RuleId.intersphinxReferencesResolve,
        });
        return null;
      }
      const cachePath = inventoryCacheFile(session, loader.id, loader.path);
      if (!fs.existsSync(cachePath) && isUrl(loader.path)) {
        session.log.debug(`Saving remote inventory file to cache ${loader.path}: ${cachePath}`);
        loader.write(cachePath);
      }
      session.log.info(
        toc(`🏫 Read ${loader.numEntries} references links for "${loader.id}" in %s.`),
      );
    }),
  );
  logMessagesFromVFile(session, vfile);
  return references;
}
