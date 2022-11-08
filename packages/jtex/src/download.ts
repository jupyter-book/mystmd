import { createHash } from 'crypto';
import fs, { createReadStream, createWriteStream, mkdirSync } from 'fs';
import type { TemplateYmlListResponse, TemplateYmlResponse } from 'myst-templates';
import fetch from 'node-fetch';
import unzipper from 'unzipper';
import { join, parse } from 'path';
import { validateUrl } from 'simple-validators';
import type { ISession } from './types';

export const TEMPLATE_FILENAME = 'template.tex';

export enum TemplateKinds {
  tex = 'tex',
  docx = 'docx',
}

const DEFAULT_TEMPLATES = {
  tex: 'tex/myst/curvenote',
  docx: 'docx/myst/default',
};

const PARTIAL_TEMPLATE_REGEX = /^[a-zA-Z0-9_-]+$/;
const TEMPLATE_REGEX = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;

function normalizeTemplateName(opts: { kind?: TemplateKinds; template?: string }) {
  const { template } = opts;
  const kind = opts.kind ?? TemplateKinds.tex;
  if (!template) {
    return DEFAULT_TEMPLATES[kind];
  }
  if (template.match(PARTIAL_TEMPLATE_REGEX)) {
    return `${kind}/myst/${template}`;
  }
  if (template.match(TEMPLATE_REGEX)) {
    return `${kind}/${template}`;
  }
  return undefined;
}

function listingUrl(session: ISession, kind?: TemplateKinds) {
  return `${session.API_URL}/templates/${kind ?? TemplateKinds.tex}`;
}

function defaultUrl(session: ISession, template: string) {
  return `${session.API_URL}/templates/${template}`;
}

function defaultPath(template: string, hash: boolean, buildDir?: string) {
  const subdirs: string[] = [];
  if (buildDir) subdirs.push(buildDir);
  subdirs.push(
    'templates',
    hash ? createHash('sha256').update(template).digest('hex') : join(...template.split('/')),
  );
  return join(...subdirs);
}

/**
 * Resolve template/path inputs to local path and remote url (if necessary)
 */
export function resolveInputs(
  session: ISession,
  opts: { kind?: TemplateKinds; template?: string; buildDir?: string },
) {
  let templateUrl: string | undefined;
  let templatePath: string | undefined;
  // Handle case where template already exists locally
  if (opts.template && fs.existsSync(opts.template)) {
    const { base, dir } = parse(opts.template);
    if (base === TEMPLATE_FILENAME) {
      templatePath = dir;
    } else if (fs.lstatSync(opts.template).isDirectory()) {
      if (fs.existsSync(join(opts.template, TEMPLATE_FILENAME))) {
        templatePath = opts.template;
      }
    }
    if (templatePath) {
      return { templatePath, templateUrl };
    }
  }
  // Handle case where template is a download URL
  templateUrl = validateUrl(opts.template, { messages: {}, suppressErrors: true, property: '' });
  if (templateUrl) {
    templatePath = defaultPath(templateUrl, true, opts.buildDir);
    return { templatePath, templateUrl };
  }
  // Handle case where template is a name
  const templateNormalized = normalizeTemplateName(opts);
  if (templateNormalized) {
    templateUrl = defaultUrl(session, templateNormalized);
    templatePath = defaultPath(templateNormalized, false, opts.buildDir);
    return { templatePath, templateUrl };
  }
  throw new Error(`Unable to resolve template from: ${opts.template}`);
}

/**
 * unnestTemplate to be used if zip file extracts into unknown folder under 'path'
 *
 * It finds the template yml and moves that and all adjacent files back up to 'path'
 */
function unnestTemplate(path: string) {
  const content = fs.readdirSync(path);
  if (!content.includes('template.yml')) {
    content.forEach((dir) => {
      if (fs.existsSync(join(path, dir, 'template.yml'))) {
        fs.readdirSync(join(path, dir))
          .filter((file) => {
            return !fs.lstatSync(join(path, dir, file)).isDirectory();
          })
          .forEach((file) => {
            fs.copyFileSync(join(path, dir, file), join(path, file));
          });
      }
    });
  }
}

export async function downloadAndUnzipTemplate(
  session: ISession,
  opts: { templatePath: string; templateUrl: string },
) {
  const { templatePath, templateUrl } = opts;
  session.log.info(`🐕 Fetching template information from ${templateUrl}`);
  const resLink = await fetch(templateUrl);
  if (!resLink.ok) {
    throw new Error(
      `Problem with template link "${templateUrl}": ${resLink.status} ${resLink.statusText}`,
    );
  }
  const { links } = (await resLink.json()) as TemplateYmlResponse;
  if (!links?.download) {
    throw new Error(`Problem with template link "${templateUrl}": No download link in response`);
  }
  session.log.debug(`Fetching template from ${links.download}`);
  const res = await fetch(links.download);
  if (!res.ok) {
    throw new Error(
      `Problem downloading template "${templateUrl}": ${res.status} ${res.statusText}`,
    );
  }
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
  unnestTemplate(templatePath);
  session.log.info(`💾 Saved template to path ${templatePath}`);
}

export async function fetchPublicTemplate(session: ISession, name: string, kind?: TemplateKinds) {
  const url = listingUrl(session);
  session.log.debug('Fetching template listing information');
  const templateUrl = `${url}/${normalizeTemplateName({ template: name, kind })}`;
  const resLink = await fetch(templateUrl);
  if (!resLink.ok) {
    throw new Error(
      `Problem with template link "${templateUrl}": ${resLink.status} ${resLink.statusText}`,
    );
  }
  return (await resLink.json()) as TemplateYmlResponse;
}

export async function listPublicTemplates(
  session: ISession,
  kind?: TemplateKinds,
): Promise<TemplateYmlListResponse['items']> {
  const url = listingUrl(session, kind);
  session.log.debug('Fetching template listing information');
  const resLink = await fetch(url);
  if (!resLink.ok) {
    throw new Error(`Problem with template link "${url}": ${resLink.status} ${resLink.statusText}`);
  }
  const templates = (await resLink.json()) as TemplateYmlListResponse;
  return templates.items;
}
