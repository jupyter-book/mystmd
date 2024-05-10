import { RuleId, fileWarn, toText, type GenericNode, type GenericParent } from 'myst-common';
import { select, selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';

export function checkLinkTextTransform(mdast: GenericParent, vfile: VFile) {
  const linkNodes = selectAll('link,linkBlock,card,crossReference', mdast) as GenericNode[];
  if (linkNodes.length === 0) return;
  linkNodes.forEach((node) => {
    if (!toText(node.children) && !select('image', node)) {
      fileWarn(
        vfile,
        `Link text is empty for <${node.urlSource ?? node.url}${node.identifier ? `#${node.identifier}` : ''}>`,
        {
          node,
          ruleId: RuleId.linkTextExists,
        },
      );
    }
  });
}
