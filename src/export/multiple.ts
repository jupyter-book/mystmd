import fs from 'fs';
import YAML from 'yaml';
import path from 'path';
import { ArticleFormatTypes } from '@curvenote/blocks';
import { ISession } from '../session';
import { Logger } from '../logging';
import { projectIdFromLink } from './utils';
import { Project } from '../models';
import { Config } from './types';
import { multipleArticleToTex } from './tex';
import { multipleArticleToPdf } from './pdf';

function validate(config: Config) {
  // TODO check against a schema & throw if bad
  return config;
}

export function loadCurvenoteFile(log: Logger, pathToYml: string): Config {
  if (!fs.existsSync(pathToYml)) throw Error(`Could not find curvenote.yml on path`);
  let config;
  try {
    config = YAML.parse(fs.readFileSync(pathToYml, 'utf-8'));
    return validate(config);
  } catch (err) {
    log.error(`Could not parse .yml file`, (err as Error).message);
    return config;
  }
}

export async function exportContent(session: ISession, pathToYml: string) {
  session.log.info(`Using configuration file: ${pathToYml}`);
  let config;
  try {
    config = loadCurvenoteFile(session.log, pathToYml);
    validate(config);
  } catch (err) {
    session.log.error((err as any).message);
  }

  try {
    // eslint-disable-next-line no-restricted-syntax
    for (const job of config?.export ?? []) {
      session.log.debug(`Running export job: ${job.name}`);

      const configPath = path.dirname(pathToYml);
      const output = path.join(configPath, job.folder);
      fs.mkdirSync(output, { recursive: true });
      session.log.debug(`Export output folder: ${output}`);

      // check for project access
      session.log.debug(`Accessing project: ${job.project}`);
      const projectId = projectIdFromLink(session, job.project);

      // eslint-disable-next-line no-await-in-loop
      const project = await new Project(session, projectId).get();
      session.log.debug(`Project access confirmed for: ${project.data.name}`);

      switch (job.kind) {
        case ArticleFormatTypes.tex:
          // TODO take other options from Config?
          multipleArticleToTex(session, project, job, configPath);
          break;
        case ArticleFormatTypes.pdf:
          multipleArticleToPdf(session, project, job, configPath);
          break;
        default:
          session.log.info(`Export job for format ${job.kind} no supported, skipping`);
          return;
      }

      session.log.debug(`Exporting ${job.contents.length} articles...`);
    }
  } catch (err) {
    session.log.error((err as any).message);
  }
}
