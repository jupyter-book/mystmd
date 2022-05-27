import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { ArticleFormatTypes } from '@curvenote/blocks';
import { Project } from '../models';
import { ISession } from '../session/types';
import { multipleArticleToPdf } from './pdf';
import { multipleArticleToTex } from './tex';
import { ExportConfig } from './types';
import { projectIdFromLink } from './utils';

export async function exportContent(session: ISession) {
  try {
    // eslint-disable-next-line no-restricted-syntax
    const { jobs } = yaml.load(fs.readFileSync('curvenote.jobs.yml', 'utf-8')) as {
      jobs: ExportConfig[];
    };
    if (!jobs) return;
    Promise.all(
      jobs.map(async (job) => {
        session.log.debug(`Running export job: ${job.name}`);

        const configPath = path.resolve('.');
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
      }),
    );
  } catch (err) {
    session.log.error((err as any).message);
  }
}
