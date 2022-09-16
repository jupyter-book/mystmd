import { createHash } from 'crypto';
import fs, { createReadStream, createWriteStream, mkdirSync } from 'fs';
import fetch from 'node-fetch';
import unzipper from 'unzipper';
import { join, parse } from 'path';
import { validateUrl } from 'simple-validators';
import type { ISession, TemplateResponse } from './types';

export const TEMPLATE_FILENAME = 'template.tex';

const PARTIAL_TEMPLATE_REGEX = /^[a-zA-Z0-9_-]+$/;
const TEMPLATE_REGEX = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;

type LinkResponse = {
  link: string;
};

function normalizeTemplateName(template: string) {
  if (template.match(PARTIAL_TEMPLATE_REGEX)) {
    return `public/${template}`;
  }
  if (template.match(TEMPLATE_REGEX)) {
    return template;
  }
  return undefined;
}

function listingUrl(session: ISession) {
  return `${session.API_URL}/templates/tex`;
}

function defaultUrl(session: ISession, template: string) {
  return `${session.API_URL}/templates/tex/${template}/download`;
}

function defaultPath(template: string, hash: boolean) {
  const folder = hash
    ? createHash('sha256').update(template).digest('hex')
    : join(...template.split('/'));
  return join('_build', 'templates', folder);
}

/**
 * Resolve template/path inputs to local path and remote url (if necessary)
 */
export function resolveInputs(session: ISession, opts: { template?: string; path?: string }) {
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
      if (opts.path && templatePath !== opts.path) {
        session.log.warn(
          `Existing template path will be used: ${templatePath}\nIgnoring alternative path: ${opts.path}`,
        );
      }
      return { templatePath, templateUrl };
    }
  }
  if (opts.path && fs.existsSync(opts.path)) {
    const { base, dir } = parse(opts.path);
    if (base === TEMPLATE_FILENAME) {
      templatePath = dir;
    } else if (fs.lstatSync(opts.path).isDirectory()) {
      if (fs.existsSync(join(opts.path, TEMPLATE_FILENAME))) {
        templatePath = opts.path;
      }
    }
    if (templatePath) {
      return { templatePath, templateUrl };
    }
  }
  // Handle case where template is a download URL
  templateUrl = validateUrl(opts.template, { messages: {}, suppressErrors: true, property: '' });
  if (templateUrl) {
    templatePath = opts.path ? opts.path : defaultPath(templateUrl, true);
    return { templatePath, templateUrl };
  }
  // Handle case where template is a name
  const templateNormalized = normalizeTemplateName(opts.template || 'default');
  if (templateNormalized) {
    templateUrl = defaultUrl(session, templateNormalized);
    templatePath = opts.path ? opts.path : defaultPath(templateNormalized, false);
    return { templatePath, templateUrl };
  }
  throw new Error(`Unable to resolve template from: ${opts.template}`);
}

export async function downloadAndUnzipTemplate(
  session: ISession,
  opts: { templatePath: string; templateUrl: string },
) {
  const { templatePath, templateUrl } = opts;
  session.log.debug(`Fetching template information from ${templateUrl}`);
  const resLink = await fetch(templateUrl);
  if (!resLink.ok) {
    throw new Error(
      `Problem with template link "${templateUrl}": ${resLink.status} ${resLink.statusText}`,
    );
  }
  const { link } = (await resLink.json()) as LinkResponse;
  if (!link) {
    throw new Error(`Problem with template link "${templateUrl}": No download link in response`);
  }
  session.log.debug(`Fetching template from ${link}`);
  const res = await fetch(link);
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
  session.log.debug(`Unzipped template to path ${templatePath}`);
}

export async function fetchPublicTemplate(session: ISession, name: string) {
  const url = listingUrl(session);
  session.log.debug('Fetching template listing information');
  const templateUrl = `${url}/${normalizeTemplateName(name)}`;
  const resLink = await fetch(templateUrl);
  if (!resLink.ok) {
    throw new Error(
      `Problem with template link "${templateUrl}": ${resLink.status} ${resLink.statusText}`,
    );
  }
  const template = (await resLink.json()) as any;
  return {
    id: template.metadata.id,
    title: template.metadata.title,
    description: template.metadata.description,
    version: template.metadata.version,
    license: template.metadata.license,
    author: {
      name: template.metadata.author.name,
      website: template.metadata.author.website,
      affiliation: template.metadata.author.affiliation,
    },
    contributor: {
      name: template.metadata.contributor.name,
      github: template.metadata.contributor.github,
      twitter: template.metadata.contributor.twitter,
      affiliation: template.metadata.contributor.affiliation,
    },
    tags: template.metadata.tags,
  };
}

export async function listPublicTemplates(
  session: ISession,
  name?: string,
): Promise<TemplateResponse[]> {
  const url = listingUrl(session);
  if (name) {
    session.log.debug('Fetching template listing information');
    const templateUrl = `${url}/${normalizeTemplateName(name)}`;
    const resLink = await fetch(templateUrl);
    if (!resLink.ok) {
      throw new Error(
        `Problem with template link "${templateUrl}": ${resLink.status} ${resLink.statusText}`,
      );
    }
    const templates = (await resLink.json()) as { items: TemplateResponse[] };
    return [];
  }
  session.log.debug('Fetching template listing information');
  const resLink = await fetch(url);
  if (!resLink.ok) {
    throw new Error(`Problem with template link "${url}": ${resLink.status} ${resLink.statusText}`);
  }
  const templates = (await resLink.json()) as { items: TemplateResponse[] };
  return templates.items;
}
