import type { Link } from 'myst-spec';
import type { GenericNode, GenericParent } from 'myst-common';
import { RuleId, plural, fileError, toText } from 'myst-common';
import { selectAll } from 'unist-util-select';
import { computeHash, tic } from 'myst-cli-utils';
import type { VFile } from 'vfile';
import type { ISession } from '../session/types.js';
import { loadFromCache, writeToCache } from '../index.js';

const ROR_MAX_AGE = 30; // in days

type RORResponse = {
  id: string;
  name: string;
};

/**
 * Build a path to the cache-file for the given ROR
 *
 * @param session: CLI session
 * @param ror: normalized ROR ID
 */
function rorCacheFilename(ror: string) {
  return `ror-${computeHash(ror)}.json`;
}

/**
 * Resolve the given ror.org ID into JSON data about the organization
 *
 * @param session - CLI session
 * @param ror - ror.org ID
 */
export async function resolveRORAsJSON(
  session: ISession,
  ror: string,
): Promise<RORResponse | undefined> {
  const url = `https://api.ror.org/organizations/${ror}`;
  session.log.debug(`Fetching ROR JSON from ${url}`);
  const response = await session.fetch(url).catch(() => {
    session.log.debug(`Request to ${url} failed.`);
    return undefined;
  });
  if (!response || !response.ok) {
    session.log.debug(`ROR fetch failed for ${url}`);
    return undefined;
  }
  const data = (await response.json()) as RORResponse;
  return data;
}

/**
 * Fetch organization data for the given ROR ID in JSON
 *
 * @param session - CLI session
 * @param vfile
 * @param node
 * @param ror - ror ID (does not include the https://ror.org)
 */
export async function resolveROR(
  session: ISession,
  vfile: VFile,
  node: GenericNode,
  ror: string,
): Promise<RORResponse | undefined> {
  if (!ror) return undefined;

  // Cache ROR resolution as JSON
  const filename = rorCacheFilename(ror);

  const cached = loadFromCache(session, filename, { maxAge: ROR_MAX_AGE });
  if (cached) return JSON.parse(cached);
  const toc = tic();
  let data;
  try {
    data = await resolveRORAsJSON(session, ror);
    if (data) {
      session.log.debug(toc(`Fetched ROR JSON for ror:${ror} in %s`));
    } else {
      fileError(vfile, `Could not find ROR "${ror}" from https://ror.org/${ror}`, {
        node,
        ruleId: RuleId.rorLinkValid,
        note: `Please check the ROR is correct and has a page at https://ror.org/${ror}`,
      });
      session.log.debug(`JSON not available from ror.org for ror:${ror}`);
    }
  } catch (error) {
    session.log.debug(`JSON from ror.org was malformed for ror:${ror}`);
  }

  if (!data) return undefined;
  writeToCache(session, filename, JSON.stringify(data));
  return data as unknown as RORResponse;
}

/**
 * Find in-line RORs and add default text
 */
export async function transformLinkedRORs(
  session: ISession,
  vfile: VFile,
  mdast: GenericParent,
  path: string,
): Promise<void> {
  const toc = tic();
  const linkedRORs = selectAll('link[protocol=ror]', mdast) as Link[];
  if (linkedRORs.length === 0) return;
  session.log.debug(`Found ${plural('%s ROR(s)', linkedRORs.length)} to auto link.`);
  let number = 0;
  await Promise.all([
    ...linkedRORs.map(async (node) => {
      const ror = node.data?.ror as string;
      if (!ror) return;
      number += 1;
      const rorData = await resolveROR(session, vfile, node, ror);
      if (rorData && toText(node.children) === ror) {
        // If the link text is the ROR, update with a organization name
        node.children = [{ type: 'text', value: rorData.name }];
      }
      return true;
    }),
  ]);
  if (number > 0) {
    session.log.info(toc(`🪄  Linked ${plural('%s ROR(s)', number)} in %s for ${path}`));
  }
  return;
}
