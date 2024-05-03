import { RuleId, fileWarn, toText, type GenericNode, type GenericParent } from 'myst-common';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';

export function checkLinkTextTransform(mdast: GenericParent, vfile: VFile) {
  const linkNodes = selectAll('link,linkBlock,card,crossReference', mdast) as GenericNode[];
  if (linkNodes.length === 0) return;
  linkNodes.forEach((node) => {
    if (!toText(node.children)) {
      fileWarn(vfile, `Link text is empty for <${node.urlSource ?? node.url}>`, {
        node,
        ruleId: RuleId.linkTextExists,
      });
    }
  });
}
