import yaml from 'js-yaml';
import { Root, PhrasingContent } from 'mdast';
import { GenericNode, select } from 'mystjs';
import { Frontmatter } from '../config/types';
import { ISession } from '../session/types';
import { FolderContext } from './types';
import { validateLicense } from './licenses';
import { warnOnUnrecognizedKeys } from '../utils';

function toText(content: PhrasingContent[]): string {
  return content
    .map((n) => {
      if ('value' in n) return n.value;
      if ('children' in n) return toText(n.children);
      return '';
    })
    .join('');
}

export const DEFAULT_FRONTMATTER: Frontmatter = {
  numbering: false,
};

export function getFrontmatterFromConfig(
  log: ISession['log'],
  folder: string,
  base: Frontmatter,
  next: Frontmatter,
) {
  const frontmatter = { ...base };
  const {
    title,
    subtitle,
    description,
    date,
    authors,
    subject,
    venue,
    biblio,
    github,
    doi,
    license,
    open_access,
    numbering,
    math,
    oxa,
    name,
    ...rest
  } = next ?? {};
  if (title) frontmatter.title = title;
  if (subtitle) frontmatter.subtitle = subtitle;
  if (description) frontmatter.description = description;
  if (date) frontmatter.date = date;
  if (authors !== undefined) {
    if (Array.isArray(authors) && authors.length > 0) {
      // TODO: Validate authors
      frontmatter.authors = authors;
    }
    if (authors === null || (typeof authors === 'boolean' && authors === false)) {
      delete frontmatter.authors;
    }
  }
  if (subject) frontmatter.subject = subject;
  if (venue) frontmatter.venue = venue;
  if (biblio) frontmatter.biblio = biblio;
  if (github) frontmatter.github = github;
  if (doi) frontmatter.doi = doi;
  if (oxa) frontmatter.oxa = oxa;
  if (name) frontmatter.name = name;
  if (license) {
    const nextLicense = validateLicense(log, license as string);
    if (nextLicense) frontmatter.license = nextLicense;
  }
  if (open_access != null) frontmatter.open_access = open_access;
  if (numbering != null) {
    if (typeof numbering === 'boolean') {
      frontmatter.numbering = numbering;
    } else {
      const {
        enumerator,
        figure,
        equation,
        table,
        code,
        heading_1,
        heading_2,
        heading_3,
        heading_4,
        heading_5,
        heading_6,
        ...restNumbering
      } = numbering;
      const nextNumbering =
        typeof frontmatter.numbering === 'boolean' ? {} : { ...frontmatter.numbering };
      if (enumerator != null) nextNumbering.enumerator = enumerator;
      if (figure != null) nextNumbering.figure = figure;
      if (equation != null) nextNumbering.equation = equation;
      if (table != null) nextNumbering.table = table;
      if (code != null) nextNumbering.code = code;
      if (heading_1 != null) nextNumbering.heading_1 = heading_1;
      if (heading_2 != null) nextNumbering.heading_2 = heading_2;
      if (heading_3 != null) nextNumbering.heading_3 = heading_3;
      if (heading_4 != null) nextNumbering.heading_4 = heading_4;
      if (heading_5 != null) nextNumbering.heading_5 = heading_5;
      if (heading_6 != null) nextNumbering.heading_6 = heading_6;
      frontmatter.numbering = nextNumbering;
      warnOnUnrecognizedKeys(log, restNumbering, `Folder "${folder}" _config.yml#numbering:`);
    }
  }
  if (math) {
    frontmatter.math = { ...frontmatter.math, ...math };
  }
  warnOnUnrecognizedKeys(log, rest, `Folder "${folder}" _config.yml:`);
  return frontmatter;
}

export function getFrontmatter(
  session: ISession,
  context: FolderContext,
  tree: Root,
  remove = true,
): Frontmatter {
  const firstNode = tree.children[0];
  const secondNode = tree.children[1];
  let removeUpTo = 0;
  let frontmatter: Frontmatter = {};
  const isYaml = firstNode?.type === 'code' && firstNode?.lang === 'yaml';
  if (isYaml) {
    frontmatter = yaml.load(firstNode.value) as Record<string, any>;
    removeUpTo += 1;
  }
  const maybeHeading = isYaml ? secondNode : firstNode;
  const isHeading = maybeHeading?.type === 'heading' && maybeHeading.depth === 1;
  if (isHeading) {
    frontmatter.title = toText(maybeHeading.children);
    removeUpTo += 1;
  }
  if (remove) tree.children.splice(0, removeUpTo);
  if (!frontmatter.title) {
    const heading = select('heading', tree) as GenericNode;
    // TODO: Improve title selection!
    frontmatter.title = heading?.children?.[0]?.value || 'Untitled';
  }
  return getFrontmatterFromConfig(session.log, context.folder, context.config, frontmatter);
}
