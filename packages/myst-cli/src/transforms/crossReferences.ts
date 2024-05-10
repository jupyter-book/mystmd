import type { VFile } from 'vfile';
import { selectAll } from 'unist-util-select';
import type { GenericNode, GenericParent } from 'myst-common';
import { RuleId, fileWarn, plural, selectMdastNodes } from 'myst-common';
import { computeHash, tic } from 'myst-cli-utils';
import { addChildrenFromTargetNode } from 'myst-transforms';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { CrossReference, Link } from 'myst-spec-ext';
import type { ISession } from '../session/types.js';
import { loadFromCache, writeToCache } from '../session/cache.js';
import type { RendererData } from './types.js';

export const XREF_MAX_AGE = 1; // in days

function mystDataFilename(dataUrl: string) {
  return `myst-${computeHash(dataUrl)}.json`;
}

async function fetchMystData(
  session: ISession,
  dataUrl: string | undefined,
  urlSource: string | undefined,
  vfile: VFile,
) {
  let note: string;
  if (dataUrl) {
    const filename = mystDataFilename(dataUrl);
    const cacheData = loadFromCache(session, filename, { maxAge: XREF_MAX_AGE });
    if (cacheData) {
      return JSON.parse(cacheData) as RendererData;
    }
    try {
      const resp = await session.fetch(dataUrl);
      if (resp.ok) {
        const data = (await resp.json()) as RendererData;
        writeToCache(session, filename, JSON.stringify(data));
        return data;
      }
    } catch {
      // data is unset
    }
    note = 'Could not load data from external project';
  } else {
    note = 'Data source URL unavailable';
  }
  fileWarn(
    vfile,
    `Unable to resolve link text from external MyST reference: ${urlSource ?? dataUrl ?? ''}`,
    {
      ruleId: RuleId.mystLinkValid,
      note,
    },
  );
  return;
}

export async function fetchMystLinkData(session: ISession, node: Link, vfile: VFile) {
  return fetchMystData(session, node.dataUrl, node.urlSource, vfile);
}

export async function fetchMystXRefData(session: ISession, node: CrossReference, vfile: VFile) {
  let dataUrl: string | undefined;
  if (node.remoteBaseUrl && node.dataUrl) {
    dataUrl = `${node.remoteBaseUrl}${node.dataUrl}`;
  }
  return fetchMystData(session, dataUrl, node.urlSource, vfile);
}

export function nodeFromMystXRefData(node: CrossReference, data: RendererData, vfile: VFile) {
  const targets = selectAll(`[identifier=${node.identifier}]`, data.mdast) as GenericNode[];
  // Ignore nodes with `identifier` that are not actually the target.
  const target = targets.find((t) => isTargetIdentifierNode(t));
  if (!target) {
    fileWarn(vfile, `Unable to resolve link text from external MyST reference: ${node.urlSource}`, {
      ruleId: RuleId.mystLinkValid,
      note: `Could not locate identifier ${node.identifier} in page content`,
    });
    return;
  }
  return target;
}

/**
 * Load external MyST project data to update link text for MyST xrefs
 */
export async function transformMystXRefs(
  session: ISession,
  vfile: VFile,
  mdast: GenericParent,
  frontmatter: PageFrontmatter,
) {
  const toc = tic();
  const nodes = selectAll('link,crossReference', mdast)
    .filter((node: GenericNode) => {
      // Only handle MyST xrefs
      return node.protocol === 'xref:myst' && node.dataUrl;
    })
    .filter((node: GenericNode) => {
      // If no link text, load the target to compute children
      if (!node.children?.length) return true;
      // If `identifier` is present, we may need to update existing children (e.g. enumerator)
      return !!node.identifier;
    });
  if (nodes.length === 0) return;
  session.log.debug(`Updating link text for ${plural('%s external MyST reference(s)', nodes)}`);
  let number = 0;
  await Promise.all([
    ...nodes.map(async (node: GenericNode) => {
      if (!node.identifier) {
        // Page references without specific node identifier
        const data = await fetchMystLinkData(session, node as Link, vfile);
        if (!data) return;
        node.children = [{ type: 'text', value: data.frontmatter?.title ?? data.slug ?? '' }];
      } else {
        const data = await fetchMystXRefData(session, node as CrossReference, vfile);
        if (!data) return;
        const target = nodeFromMystXRefData(node as CrossReference, data, vfile);
        addChildrenFromTargetNode(node as any, target as any, frontmatter.numbering, vfile);
      }
      number += 1;
    }),
  ]);
  const denominator = number === nodes.length ? '' : `/${nodes.length}`;
  session.log.info(
    toc(
      `🪄  Updated link text for ${plural(`%s${denominator} external MyST reference(s)`, number)} in %s seconds`,
    ),
  );
}
