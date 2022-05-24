import fs from 'fs';
import path from 'path';
import { Store } from 'redux';
import { initializeQuickstartConfig, updateSiteConfig } from './newconfig';
import { ISession } from './session';
import { RootState } from './store';
import { getManifest, updateProject } from './toc';
import { cloneCurvespace } from './web';
import { buildContent } from './web/prepare';
import { makeExecutable } from './export';
import { serverPath } from './web/transforms';
import { getServerLogger } from './web/customLoggers';

export async function quickstart(session: ISession) {
  const folder = '.';
  initializeQuickstartConfig(folder);
  updateSiteConfig(session.store, folder);

  updateProject(session.store, folder);

  await cloneCurvespace(session, {});
  await buildContent(session, {});
  const pathname = path.join(serverPath({}), 'app', 'config.json');
  session.log.info('⚙️  Writing config.json');
  const manifest = getManifest(session.store.getState());
  fs.writeFileSync(pathname, JSON.stringify(manifest));
  await makeExecutable(`cd ${serverPath({})}; npm run serve`, getServerLogger(session))();
}

export function update(store: Store<RootState>, folder: string) {
  updateSiteConfig(store, folder);
}
