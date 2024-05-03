import type { VFile } from 'vfile';
import { select, selectAll } from 'unist-util-select';
import type { GenericNode, GenericParent } from 'myst-common';
import { RuleId, fileWarn, plural } from 'myst-common';
import { tic } from 'myst-cli-utils';
import { addChildrenFromTargetNode } from 'myst-transforms';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { ISession } from '../session/types.js';
import type { RendererData } from './types.js';

/**
 * Load external MyST project data to update link text for MyST xrefs
 */
export async function transformMystXrefs(
  session: ISession,
  vfile: VFile,
  mdast: GenericParent,
  frontmatter: PageFrontmatter,
) {
  const toc = tic();
  const nodes = selectAll('link,crossReference', mdast)
    .filter((node: GenericNode) => {
      // Only handle MyST xrefs
      return node.protocol === 'myst' && node.dataUrl;
    })
    .filter((node: GenericNode) => {
      // Only update link text if not already present
      return !node.children?.length;
    });
  if (nodes.length === 0) return;
  session.log.debug(`Updating link text for ${plural('%s external MyST reference(s)', nodes)}`);
  let number = 0;
  let data: RendererData | undefined;
  await Promise.all([
    ...nodes.map(async (node: GenericNode) => {
      try {
        const resp = await fetch(node.dataUrl);
        if (resp.ok) {
          data = await resp.json();
        }
      } catch {
        // data is unset
      }
      if (!data) {
        fileWarn(
          vfile,
          `Unable to resolve link text from external MyST reference: ${node.urlSource}`,
          { ruleId: RuleId.mystLinkValid, note: 'Could not load data from external project' },
        );
        return;
      }
      if (!node.identifier) {
        // Page references without specific node identifier
        node.children = [{ type: 'text', value: data.frontmatter?.title ?? data.slug ?? '' }];
      } else {
        const target = select(`[identifier=${node.identifier}]`, data.mdast) as GenericNode;
        if (!target) {
          fileWarn(
            vfile,
            `Unable to resolve link text from external MyST reference: ${node.urlSource}`,
            {
              ruleId: RuleId.mystLinkValid,
              note: `Could not locate identifier ${node.identifier} in page content`,
            },
          );
          return;
        }
        addChildrenFromTargetNode(node as any, target as any, frontmatter.numbering, vfile);
        number += 1;
      }
    }),
  ]);
  const denominator = number === nodes.length ? '' : `/${nodes.length}`;
  session.log.info(
    toc(
      `🪄  Updated link text for ${plural(`%s${denominator} external MyST reference(s)`, number)} in %s seconds`,
    ),
  );
}
