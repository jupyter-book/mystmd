import inquirer from 'inquirer';
import pLimit from 'p-limit';
import { projectToJupyterBook } from '../export';
import { Project } from '../models';
import { CurvenoteConfig, CURVENOTE_YML, SyncConfig } from '../config';
import { ISession } from '../session/types';
import { tic } from '../export/utils/exec';
import { projectLogString } from './utls';
import { LogLevel, getLevel } from '../logging';

/**
 * Check the item has a remote
 *
 * @param item the item to pull
 * @returns boolean
 */
function hasRemote(item: SyncConfig): boolean {
  return Boolean(item.link) && Boolean(item.id);
}

/**
 * Check the item exists and has a remote
 *
 * @param folder the local path of the folder to pull, used in message only
 * @param item the item to validate, whcih may be undefined
 * @returns a validated SyncConfig
 */
function throwIfMissingOrNoRemote(folder: string, item?: SyncConfig): SyncConfig {
  if (!item) throw new Error(`Could not find ${folder} in ${CURVENOTE_YML}`);
  if (!hasRemote(item)) throw new Error(`Item ${folder} has no remote, cannot pull`);
  return item as SyncConfig;
}

/**
 * Pull content for a project
 *
 * @param session the session
 * @param id the item id which is also the project id for remote content
 * @param folder the local folder to pull
 * @param level logging level from the cli
 */
async function pullProject(session: ISession, id: string, folder: string, level?: LogLevel) {
  const log = getLevel(session.log, level ?? LogLevel.debug);
  const project = await new Project(session, id).get();
  const toc = tic();
  log(`Pulling ${folder} from ${projectLogString(project)}`);
  await projectToJupyterBook(session, project.id, {
    path: folder,
    writeConfig: false,
    createFrontmatter: true,
    titleOnlyInFrontmatter: true,
  });
  log(toc(`🚀 Pulled ${folder} in %s`));
}

/**
 * Pull content for all projects in the config.sync that have remotes
 *
 * @param session
 * @param opts
 */
export async function pullProjects(
  session: ISession,
  opts: { config: CurvenoteConfig; level?: LogLevel; folder?: string },
) {
  const { config } = opts;
  const limit = pLimit(1);
  if (opts.folder) {
    const item = throwIfMissingOrNoRemote(
      opts.folder,
      config.sync.find((i) => i.folder === opts.folder),
    );
    await pullProject(session, item.id, opts.folder, opts.level);
  } else {
    const remoteContentOnly = config.sync.filter(hasRemote);
    await Promise.all(
      remoteContentOnly.map(({ folder, id }) =>
        limit(async () => pullProject(session, id, folder, opts.level)),
      ),
    );
  }
}

export async function pull(session: ISession, folder?: string) {
  const { config } = session;
  if (!config) throw new Error('Must have config to pull content.');

  if (folder)
    throwIfMissingOrNoRemote(
      folder,
      config.sync.find((item) => item.folder === folder),
    );

  const message = folder
    ? `Pulling will overwrite all content in ${folder}. Are you sure?`
    : 'Pulling content will overwrite all content in folders. Are you sure?';

  const { confirm } = await inquirer.prompt([
    {
      name: 'confirm',
      message,
      type: 'confirm',
      default: false,
    },
  ]);
  if (confirm) {
    await pullProjects(session, { config, level: LogLevel.info, folder });
  }
}
