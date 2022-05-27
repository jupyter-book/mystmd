import yaml from 'js-yaml';
import { Root, PhrasingContent } from 'mdast';
import { GenericNode, select } from 'mystjs';
import { validateLicense } from '../licenses';
import { ISession } from '../session/types';
import { selectors } from '../store';
import { warnOnUnrecognizedKeys } from '../utils';
import { Frontmatter } from './types';

function toText(content: PhrasingContent[]): string {
  return content
    .map((n) => {
      if ('value' in n) return n.value;
      if ('children' in n) return toText(n.children);
      return '';
    })
    .join('');
}

/**
 * Resolve two sets of frontmatter to a single frontmatter object
 *
 * `next` takes precedence over `base`
 */
export function resolveFrontmatter(
  base: Frontmatter,
  next: Frontmatter,
  log: ISession['log'],
  fileToLog?: string,
): Frontmatter {
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
  if (typeof numbering === 'boolean' || numbering == null) {
    frontmatter.numbering = numbering ?? false;
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
    warnOnUnrecognizedKeys(log, restNumbering, `${fileToLog || ''}#numbering:`);
  }
  if (math) {
    frontmatter.math = { ...frontmatter.math, ...math };
  }
  warnOnUnrecognizedKeys(log, rest, fileToLog ? `${fileToLog}:` : '');
  return frontmatter;
}

function frontmatterFromMdastTree(
  tree: Root,
  remove = true,
): { tree: Root; frontmatter: Frontmatter } {
  const firstNode = tree.children[0];
  const secondNode = tree.children[1];
  let removeUpTo = 0;
  let frontmatter: Frontmatter = {};
  const firstIsYaml = firstNode?.type === 'code' && firstNode?.lang === 'yaml';
  if (firstIsYaml) {
    frontmatter = yaml.load(firstNode.value) as Record<string, any>;
    removeUpTo += 1;
  }
  const nextNode = firstIsYaml ? secondNode : firstNode;
  const nextNodeIsHeading = nextNode?.type === 'heading' && nextNode.depth === 1;
  if (nextNodeIsHeading) {
    frontmatter.title = toText(nextNode.children);
    removeUpTo += 1;
  }
  if (remove) tree.children.splice(0, removeUpTo);
  if (!frontmatter.title) {
    const heading = select('heading', tree) as GenericNode;
    // TODO: Improve title selection!
    frontmatter.title = heading?.children?.[0]?.value;
  }
  return { tree, frontmatter };
}

export function getPageFrontmatter(
  session: ISession,
  path: string,
  tree: Root,
  remove = true,
): Frontmatter {
  const state = session.store.getState();
  const site = selectors.selectLocalSiteConfig(state);
  const project = selectors.selectLocalProjectConfig(state, path)?.frontmatter ?? {};
  const page = frontmatterFromMdastTree(tree, remove).frontmatter;
  const sitematter = resolveFrontmatter({}, site?.frontmatter ?? {}, session.log);
  const projmatter = resolveFrontmatter(sitematter, project, session.log);
  const frontmatter = resolveFrontmatter(projmatter, page, session.log);
  if (site?.design?.hide_authors) {
    delete frontmatter.authors;
  }
  return frontmatter;
}
