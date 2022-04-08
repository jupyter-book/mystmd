import inquirer from 'inquirer';
import pLimit from 'p-limit';
import { projectToJupyterBook } from '../export';
import { Project } from '../models';
import { CurvenoteConfig } from '../config';
import { ISession } from '../session/types';
import { tic } from '../export/utils/exec';
import { projectLogString } from './utls';
import { LogLevel, getLevel } from '../logging';

export async function pullProjects(
  session: ISession,
  opts: { config: CurvenoteConfig; level?: LogLevel },
) {
  const { config } = opts;
  const limit = pLimit(1);
  const log = getLevel(session.log, opts.level ?? LogLevel.debug);
  await Promise.all(
    config.sync.map(({ folder, id }) =>
      limit(async () => {
        const project = await new Project(session, id).get();
        const toc = tic();
        log(`Pulling ${folder} from ${projectLogString(project)}`);
        await projectToJupyterBook(session, project.id, { path: folder, writeConfig: false });
        log(toc(`🚀 Pulled ${folder} in %s`));
      }),
    ),
  );
}

export async function pull(session: ISession) {
  const { config } = session;
  if (!config) throw new Error('Must have config to pull content.');
  const { confirm } = await inquirer.prompt([
    {
      name: 'confirm',
      message: 'Pulling content will overwrite all content in folders. Are you sure?',
      type: 'confirm',
      default: false,
    },
  ]);
  if (confirm) {
    await pullProjects(session, { config, level: LogLevel.info });
  }
}
