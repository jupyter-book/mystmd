import yaml from 'js-yaml';
import { Root, PhrasingContent } from 'mdast';
import { GenericNode, select } from 'mystjs';
import { ISession } from '../session/types';
import { FolderContext, Frontmatter } from './types';

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
  session: ISession,
  context: Pick<FolderContext, 'config' | 'folder'>,
  frontmatter = { ...DEFAULT_FRONTMATTER },
) {
  const { authors, subject, journal, github, doi, license, open_access, numbering, ...rest } =
    context.config ?? {};
  if (authors) frontmatter.authors = authors;
  if (subject) frontmatter.subject = subject;
  if (journal) frontmatter.journal = journal;
  if (github) frontmatter.github = github;
  if (doi) frontmatter.doi = doi;
  if (license) frontmatter.license = license;
  if (open_access) frontmatter.open_access = open_access;
  if (numbering) frontmatter.numbering = numbering;
  const extraKeys = Object.keys(rest);
  if (extraKeys.length > 0) {
    session.log.warn(
      `Folder "${context.folder}" config.yml did not recognize key${
        extraKeys.length > 1 ? 's' : ''
      }: "${extraKeys.join('", "')}"`,
    );
  }
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
  return getFrontmatterFromConfig(session, context, frontmatter);
}
