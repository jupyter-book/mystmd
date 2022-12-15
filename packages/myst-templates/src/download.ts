import fs, { createReadStream, createWriteStream, mkdirSync } from 'fs';
import { dirname, join, parse } from 'path';
import { createHash } from 'crypto';
import yaml from 'js-yaml';
import { createGitLogger, makeExecutable } from 'myst-cli-utils';
import fetch from 'node-fetch';
import { validateUrl } from 'simple-validators';
import unzipper from 'unzipper';
import type { TemplateYmlListResponse, TemplateYmlResponse, ISession } from './types';

export const TEMPLATE_FILENAME = 'template.tex';
export const TEMPLATE_YML = 'template.yml';

export enum TemplateKinds {
  tex = 'tex',
  docx = 'docx',
  site = 'site',
}

const DEFAULT_TEMPLATES = {
  tex: 'tex/myst/curvenote',
  docx: 'docx/myst/default',
  site: 'site/myst/book-theme',
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

function defaultPath(
  template: string,
  hash: boolean,
  opts: { kind?: TemplateKinds; buildDir?: string },
) {
  const { kind, buildDir } = opts;
  const subdirs: string[] = [];
  if (buildDir) subdirs.push(buildDir);
  subdirs.push('templates');
  if (hash) {
    if (kind) subdirs.push(kind);
    subdirs.push(createHash('sha256').update(template).digest('hex'));
  } else {
    subdirs.push(join(...template.split('/')));
  }
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
    if (base === TEMPLATE_YML || base === TEMPLATE_FILENAME) {
      templatePath = dir;
    } else if (fs.lstatSync(opts.template).isDirectory()) {
      if (fs.existsSync(join(opts.template, TEMPLATE_YML))) {
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
    templatePath = defaultPath(templateUrl, true, opts);
    return { templatePath, templateUrl };
  }
  // Handle case where template is a name
  const templateNormalized = normalizeTemplateName(opts);
  if (templateNormalized) {
    templateUrl = defaultUrl(session, templateNormalized);
    templatePath = defaultPath(templateNormalized, false, opts);
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
  if (!content.includes(TEMPLATE_YML)) {
    content.forEach((dir) => {
      const templateYmlFile = join(path, dir, TEMPLATE_YML);
      if (fs.existsSync(templateYmlFile)) {
        fs.copyFileSync(templateYmlFile, join(path, TEMPLATE_YML));
        const templateYml = yaml.load(fs.readFileSync(templateYmlFile).toString()) as {
          files?: string[];
        };
        templateYml.files?.forEach((file) => {
          const source = join(path, dir, ...file.split('/'));
          const dest = join(path, ...file.split('/'));
          fs.mkdirSync(dirname(dest), { recursive: true });
          fs.copyFileSync(source, dest);
        });
      }
    });
  }
}

export async function downloadTemplate(
  session: ISession,
  opts: { templatePath: string; templateUrl: string },
) {
  const { templatePath, templateUrl } = opts;
  let downloadUrl: string | undefined;
  if (templateUrl.endsWith('.zip') || templateUrl.endsWith('.git')) {
    downloadUrl = templateUrl;
  } else {
    downloadUrl = await fetchTemplateDownloadLink(session, opts);
  }
  if (downloadUrl.endsWith('.git')) {
    await cloneTemplate(session, downloadUrl, opts);
  } else {
    await downloadAndUnzipTemplate(session, downloadUrl, opts);
  }
  session.log.info(`💾 Saved template to path ${templatePath}`);
}

export async function fetchTemplateDownloadLink(session: ISession, opts: { templateUrl: string }) {
  const { templateUrl } = opts;
  session.log.info(`🐕 Fetching template metadata from ${templateUrl}`);
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
  if (!links.download.endsWith('.zip') && !links.download.endsWith('.git')) {
    throw new Error(`Problem with template link "${templateUrl}": Download link must zip or git`);
  }
  return links.download;
}

export async function downloadAndUnzipTemplate(
  session: ISession,
  downloadUrl: string,
  opts: { templatePath: string },
) {
  session.log.info(`🐕 Fetching template from ${downloadUrl}`);
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    throw new Error(
      `Problem downloading template "${downloadUrl}": ${res.status} ${res.statusText}`,
    );
  }
  const { templatePath } = opts;
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
}

export async function cloneTemplate(
  session: ISession,
  downloadUrl: string,
  opts: { templatePath: string; branch?: string },
) {
  session.log.info(`🌎 Cloning template from ${downloadUrl}`);
  const { templatePath } = opts;
  const branch = opts.branch || 'main';
  if (branch !== 'main') {
    session.log.warn(`👷 Warning, using a branch: ${branch}`);
  }
  await makeExecutable(
    `git clone --recursive --depth 1 --branch ${branch} ${downloadUrl} ${templatePath}`,
    createGitLogger(session),
  )();
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
