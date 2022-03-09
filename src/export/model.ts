import { Author, Blocks, oxaLink } from '@curvenote/blocks';
import { Project, Block, User, Version } from '../models';
import { ISession } from '../session/types';

export interface ExportDateModel {
  year: number;
  month: number;
  day: number;
}

export interface ExportAuthorModel {
  name: string;
  affiliation?: string;
  location?: string;
  curvenote?: string;
  is_corresponding: boolean;
}

export interface DocumentModel {
  title: string;
  description: string;
  short_title: string;
  authors: ExportAuthorModel[];
  date: ExportDateModel;
  tags: string[];
  oxalink: string | null;
}

export function toShortTitle(title: string): string {
  return title.slice(0, 50);
}

export function toDateFields(d: Date): ExportDateModel {
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1, // latex expects 1-indexed month
    day: d.getDate(),
  };
}

export async function toAuthorFields(
  session: ISession,
  project: Project,
  author: Author,
): Promise<ExportAuthorModel> {
  const affiliations = Object.fromEntries((project.data.affiliations ?? []).map((a) => [a.id, a]));
  const user = author.userId ? await new User(session, author.userId as string).get() : null;
  return {
    name: author.name || '',
    affiliation: affiliations[user?.data.affiliation ?? '']?.text || '',
    location: user?.data.location,
    curvenote: user ? `${session.SITE_URL}/@${user.data.username}` : undefined,
    is_corresponding: author.corresponding,
  };
}

export async function buildDocumentModelFromBlock(
  session: ISession,
  block: Block,
  version: Version<Blocks.Article>,
  options: Record<string, any>,
  escapeFn?: (s: string) => string,
): Promise<DocumentModel> {
  const project = await new Project(session, block.id.project).get();
  const authors = await Promise.all(
    block.data.authors.map((a) => toAuthorFields(session, project, a)),
  );

  const escapeIt = (s: string) => escapeFn?.(s ?? '') ?? '';

  return {
    title: escapeIt(block.data.title),
    description: escapeIt(block.data.description),
    short_title: escapeIt(toShortTitle(block.data.title)),
    authors,
    date: toDateFields(version.data.date),
    tags: block.data.tags.map((t) => escapeIt(t)).filter((t) => t && t.length > 0),
    oxalink: oxaLink(session.SITE_URL, version.id),
  };
}
