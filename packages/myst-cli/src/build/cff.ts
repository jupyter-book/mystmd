import path from 'node:path';
import yaml from 'js-yaml';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import { extractPart, fileWarn, toText } from 'myst-common';
import type { Affiliation, Contributor, PageFrontmatter } from 'myst-frontmatter';
import { filterKeys } from 'simple-validators';
import { VFile } from 'vfile';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';
import { logMessagesFromVFile } from '../utils/logging.js';
import { KNOWN_IMAGE_EXTENSIONS } from '../utils/resolveExtension.js';
import type { ExportWithOutput, ExportFnOptions } from './types.js';
import { cleanOutput } from './utils/cleanOutput.js';
import { getFileContent } from './utils/getFileContent.js';

type PersonCFF = {
  'family-names': string;
  'given-names': string;
  'name-particle'?: string;
  'name-suffix'?: string;
  affiliation?: string;
  address?: string;
  city?: string;
  region?: string;
  'post-code'?: string;
  country?: string;
  orcid?: string;
  email?: string;
  tel?: string;
  fax?: string;
  website?: string;
};

type EntityCFF = {
  name: string;
  address?: string;
  city?: string;
  region?: string;
  'post-code'?: string;
  country?: string;
  orcid?: string;
  email?: string;
  tel?: string;
  fax?: string;
  website?: string;
  'date-start'?: string;
  'date-end'?: string;
  location?: string;
};
type CFF = {
  'cff-version': string;
  message: string;
  type?: string;
  abstract?: string;
  title?: string;
  authors?: (EntityCFF | PersonCFF)[];
  contact?: (EntityCFF | PersonCFF)[];
  commit?: string;
  copyright?: string;
  doi?: string;
  editors?: (EntityCFF | PersonCFF)[];
  end?: number;
  issue?: number;
  'issue-title'?: string;
  journal?: string;
  keywords?: string[];
  license?: string;
  'license-url'?: string;
  month?: number;
  pages?: number;
  repository?: string;
  start?: number;
  url?: string;
  volume?: number;
  'volume-title'?: string;
  year?: number;
};

const CFF_KEYS = [
  'abbreviations',
  'abstract',
  'authors',
  'collection-doi',
  'collection-title',
  'collection-type',
  'commit',
  'conference',
  'contact',
  'copyright',
  'data-type',
  'database',
  'database-provider',
  'date-accessed',
  'date-downloaded',
  'date-published',
  'date-released',
  'department',
  'doi',
  'edition',
  'editors',
  'editors-series',
  'end',
  'entry',
  'filename',
  'format',
  'institution',
  'isbn',
  'issn',
  'issue',
  'issue-date',
  'issue-title',
  'journal',
  'keywords',
  'languages',
  'license',
  'license-url',
  'location',
  'loc-start',
  'loc-end',
  'medium',
  'month',
  'nihmsid',
  'notes',
  'number',
  'number-volumes',
  'pages',
  'patent-states',
  'pmcid',
  'publisher',
  'recipients',
  'repository',
  'repository-code',
  'repository-artifact',
  'scope',
  'section',
  'senders',
  'status',
  'start',
  'thesis-type',
  'title',
  'translators',
  'type',
  'url',
  'version',
  'volume',
  'volume-title',
  'year',
  'year-original',
];

function authorToCFF(author: Contributor, affiliations?: Affiliation[]): PersonCFF | EntityCFF {
  if (author.collaboration) {
    return {
      name: author.name ?? author.institution ?? '',
      address: author.address,
      city: author.city,
      region: author.state,
      'post-code': author.postal_code,
      country: author.country,
      email: author.email,
      tel: author.phone,
      fax: author.fax,
      website: author.url,
    };
  }
  const { family, given, dropping_particle, non_dropping_particle, suffix } =
    author.nameParsed ?? {};
  const affiliation = affiliations?.find(
    (aff) => author.affiliations?.[0] && aff.id === author.affiliations?.[0],
  );
  return {
    'family-names': `${non_dropping_particle ? `${non_dropping_particle} ` : ''}${family}`,
    'given-names': given ?? '',
    'name-particle': dropping_particle,
    'name-suffix': suffix,
    affiliation: affiliation?.name,
    address: affiliation?.address,
    city: affiliation?.city,
    region: affiliation?.state,
    'post-code': affiliation?.postal_code,
    country: affiliation?.country,
    orcid: author.orcid,
    email: author.email,
    tel: author.phone,
    fax: author.fax,
    website: author.url,
  };
}

function exportOptionsToCFF(exportOptions: ExportWithOutput): CFF {
  // Handle overlap of key "format" between CFF and export
  const exportForCFF: Record<string, any> = { ...exportOptions, format: undefined };
  if (exportForCFF['cff-format']) {
    exportForCFF.format = exportForCFF['cff-format'];
  }
  return filterKeys(exportForCFF, CFF_KEYS) as CFF;
}

function frontmatterToCFF(frontmatter: PageFrontmatter, abstract?: string): CFF {
  const { first_page, last_page, issue, volume } = frontmatter.biblio ?? {};
  const license = frontmatter.license?.content ?? frontmatter.license?.code;
  const contact = frontmatter.authors
    ?.filter((author) => author.corresponding)
    .map((author) => authorToCFF(author, frontmatter.affiliations));
  return {
    'cff-version': '1.0.0',
    message: 'Please cite the following works when using this software.',
    type: 'article',
    abstract,
    title: frontmatter.title,
    authors: frontmatter.authors?.map((author) => authorToCFF(author, frontmatter.affiliations)),
    contact: contact?.length ? contact : undefined,
    copyright: frontmatter.copyright,
    doi: frontmatter.doi,
    editors: frontmatter.editors
      ?.map((id) => {
        const editor = frontmatter.contributors?.find((contrib) => contrib.id === id);
        if (!editor) return undefined;
        return authorToCFF(editor, frontmatter.affiliations);
      })
      .filter((editor): editor is PersonCFF | EntityCFF => !!editor),
    end: typeof last_page === 'number' ? last_page : undefined,
    issue: typeof issue === 'number' ? issue : undefined,
    'issue-title': typeof issue === 'string' ? issue : undefined,
    journal: frontmatter.venue?.title,
    keywords: frontmatter.keywords,
    license: license?.id,
    'license-url': license?.url,
    pages:
      typeof last_page === 'number' && typeof first_page === 'number'
        ? last_page - first_page + 1
        : undefined,
    month: frontmatter?.date ? new Date(frontmatter.date).getMonth() : undefined,
    start: typeof first_page === 'number' ? first_page : undefined,
    url: frontmatter.source,
    volume: typeof volume === 'number' ? volume : undefined,
    'volume-title': typeof volume === 'string' ? volume : undefined,
    year: frontmatter?.date ? new Date(frontmatter.date).getFullYear() : undefined,
    repository: frontmatter?.github,
  };
}

export async function runCffExport(
  session: ISession,
  sourceFile: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
) {
  const toc = tic();
  const { output, articles } = exportOptions;
  const { clean, projectPath, extraLinkTransformers } = opts ?? {};
  const article = articles[0];
  const state = session.store.getState();
  let frontmatter: PageFrontmatter | undefined;
  let abstract: string | undefined;
  if (projectPath && selectors.selectLocalConfigFile(state, projectPath) === sourceFile) {
    frontmatter = selectors.selectLocalProjectConfig(state, projectPath);
    // TODO: better "part-from-project" function - and allow abstract at project level
    // abstract = frontmatter?.parts?.abstract?.join('\n\n');
  } else if (article.file) {
    const [content] = await getFileContent(session, [article.file], {
      projectPath,
      imageExtensions: KNOWN_IMAGE_EXTENSIONS,
      extraLinkTransformers,
    });
    frontmatter = content.frontmatter;
    const abstractMdast = extractPart(content.mdast, 'abstract');
    if (abstractMdast) abstract = toText(abstractMdast);
  }
  if (!frontmatter) return { tempFolders: [] };
  if (clean) cleanOutput(session, output);
  const vfile = new VFile();
  vfile.path = output;
  if (path.basename(output) !== 'CITATION.cff') {
    fileWarn(
      vfile,
      `Invalid Citation File Format filename ${path.basename(output)} - CFF requires filename 'CITATION.cff'`,
    );
  }
  const cff = {
    ...frontmatterToCFF(frontmatter, abstract),
    ...exportOptionsToCFF(exportOptions),
  };
  logMessagesFromVFile(session, vfile);
  session.log.info(toc(`📑 Exported CFF in %s, copying to ${output}`));
  writeFileToFolder(output, yaml.dump(cff));
  return { tempFolders: [] };
}
