import fs from 'node:fs';
import { join } from 'node:path';
import fetch from 'node-fetch';
import { Inventory } from 'intersphinx';
import { tic, isUrl, computeHash, writeFileToFolder } from 'myst-cli-utils';
import { RuleId, fileError } from 'myst-common';
import type { ExternalReference } from 'myst-frontmatter';
import type { MystXRefs, ResolvedExternalReference } from 'myst-transforms';
import { VFile } from 'vfile';
import { castSession } from '../session/cache.js';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';

function inventoryCacheFile(
  session: ISession,
  refKind: 'intersphinx' | 'myst',
  id?: string,
  path?: string,
) {
  const hashcontent = `${id}${path}`;
  const ext = refKind === 'intersphinx' ? 'inv' : 'json';
  const filename = `${refKind}-${computeHash(hashcontent)}.${ext}`;
  const cacheFolder = join(session.buildPath(), 'cache');
  if (!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder, { recursive: true });
  return join(cacheFolder, filename);
}

async function preloadReference(session: ISession, key: string, reference: ExternalReference) {
  const ref: ResolvedExternalReference = {
    key,
    url: reference.url,
    kind: reference.kind,
  };
  const mystCachePath = inventoryCacheFile(session, 'myst', key, reference.url);
  const intersphinxCachePath = inventoryCacheFile(session, 'intersphinx', key, reference.url);
  if ((!ref.kind || ref.kind === 'myst') && fs.existsSync(mystCachePath)) {
    const toc = tic();
    const xrefs: MystXRefs = JSON.parse(fs.readFileSync(mystCachePath).toString());
    session.log.debug(`Loading cached inventory file for ${reference.url}: ${mystCachePath}`);
    session.log.info(
      toc(`🏫 Read ${xrefs.references.length} references links for "${key}" in %s.`),
    );
    ref.kind = 'myst';
    ref.value = xrefs;
  } else if ((!ref.kind || ref.kind === 'intersphinx') && fs.existsSync(intersphinxCachePath)) {
    const inventory = new Inventory({ id: key, path: reference.url });
    const localInventory = new Inventory({ id: key, path: intersphinxCachePath });
    session.log.debug(
      `Loading cached inventory file for ${reference.url}: ${intersphinxCachePath}`,
    );
    const toc = tic();
    await localInventory.load();
    inventory.project = localInventory.project;
    inventory.version = localInventory.version;
    inventory.data = localInventory.data;
    inventory._loaded = true;
    session.log.info(toc(`🏫 Read ${inventory.numEntries} references links for "${key}" in %s.`));
    ref.kind = 'intersphinx';
    ref.value = inventory;
  }
  return ref;
}

async function loadReference(
  session: ISession,
  vfile: VFile,
  reference: ResolvedExternalReference,
) {
  if (reference.kind === 'myst' && reference.value) {
    return reference;
  }
  if (reference.kind === 'intersphinx' && (reference.value as Inventory)?._loaded) {
    return reference;
  }
  if (!reference.kind || reference.kind === 'myst') {
    const mystXRefsUrl = `${reference.url}/myst.xref.json`;
    session.log.debug(`Attempting to load MyST xref file: ${mystXRefsUrl}`);
    const toc = tic();
    const mystXRefsResp = await fetch(mystXRefsUrl);
    if (mystXRefsResp.status === 200) {
      reference.kind = 'myst';
      const mystXRefs = (await mystXRefsResp.json()) as MystXRefs;
      reference.value = mystXRefs;
      const cachePath = inventoryCacheFile(session, 'myst', reference.key, reference.url);
      session.log.debug(`Saving remote myst xref file to cache ${reference.url}: ${cachePath}`);
      writeFileToFolder(cachePath, JSON.stringify(mystXRefs));
      session.log.info(
        toc(`🏫 Read ${mystXRefs.references.length} references for "${reference.key}" in %s.`),
      );
      return reference;
    } else if (reference.kind === 'myst') {
      fileError(vfile, `Problem fetching references entry: ${reference.key} (${mystXRefsUrl})`, {
        ruleId: RuleId.intersphinxReferencesResolve,
      });
      return;
    } else {
      session.log.debug(`Unable to load reference "${reference.key}" as MyST cross-references`);
    }
  }
  if (!reference.kind || reference.kind === 'intersphinx') {
    const inventory = new Inventory({ id: reference.key, path: reference.url });
    const toc = tic();
    try {
      session.log.debug(`Attempting to load inventory file ${inventory.path}/objects.inv`);
      await inventory.load();
    } catch (error) {
      if (reference.kind === 'intersphinx') {
        session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
        fileError(vfile, `Problem fetching references entry: ${inventory.id} (${inventory.path})`, {
          ruleId: RuleId.intersphinxReferencesResolve,
        });
      } else {
        session.log.debug(`Unable to load reference "${reference.key}" as intersphinx`);
      }
      return null;
    }
    const cachePath = inventoryCacheFile(session, 'intersphinx', inventory.id, inventory.path);
    if (!fs.existsSync(cachePath) && isUrl(inventory.path)) {
      session.log.debug(`Saving remote inventory file to cache ${inventory.path}: ${cachePath}`);
      inventory.write(cachePath);
    }
    session.log.info(
      toc(`🏫 Read ${inventory.numEntries} references for "${inventory.id}" in %s.`),
    );
  }
}

/**
 * Load MyST and intersphinx references from project frontmatter
 *
 * @param session session with logging
 * @param opts loading options
 */
export async function loadReferences(
  session: ISession,
  opts: { projectPath: string },
): Promise<void[]> {
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
      .map(async ([key, val]) => {
        if (!cache.$externalReferences[key]) {
          cache.$externalReferences[key] = await preloadReference(session, key, val);
        }
        return cache.$externalReferences[key];
      })
      .filter((exists) => !!exists),
  );
  return Promise.all(
    references.map(async (ref) => {
      await loadReference(session, vfile, ref);
    }),
  );
}
