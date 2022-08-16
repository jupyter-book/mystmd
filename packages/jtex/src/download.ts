import fetch from 'node-fetch';
import unzipper from 'unzipper';
import { join } from 'path';
import { createReadStream, createWriteStream, mkdirSync } from 'fs';
import type { ISession } from './types';

type LinkResponse = {
  link: string;
};

export async function downloadAndUnzipTemplate(
  session: ISession,
  opts: { template: string; path: string },
) {
  const templateName = opts.template.includes('/') ? opts.template : `public/${opts.template}`;
  const [org, template] = templateName.split('/');
  const url = `${session.API_URL}/templates/tex/${templateName}/download`;
  session.log.debug(`Fetching template information from ${url}`);
  const resLink = await fetch(url);
  if (!resLink.ok)
    throw new Error(`Problem with template link "${url}": ${resLink.status} ${resLink.statusText}`);
  const { link } = (await resLink.json()) as LinkResponse;
  if (!link) throw new Error(`Problem with template link "${url}": No download link in response`);
  session.log.debug(`Fetching template from ${link}`);
  const res = await fetch(link);
  if (!res.ok)
    throw new Error(`Problem downloading template "${url}": ${res.status} ${res.statusText}`);
  const templatePath = join(opts.path, org, template);
  const zipFile = join(templatePath, 'template.zip');
  mkdirSync(templatePath, { recursive: true });
  const fileStream = createWriteStream(zipFile);
  await new Promise((resolve, reject) => {
    res.body?.pipe(fileStream);
    res.body?.on('error', reject);
    fileStream.on('finish', resolve);
  });
  session.log.debug(`Unzipping template on disk ${zipFile}`);
  await createReadStream(zipFile)
    .pipe(unzipper.Extract({ path: templatePath }))
    .promise();
  session.log.debug(`Unzipped template to path ${templatePath}`);
}
