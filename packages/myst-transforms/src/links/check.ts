import {
  RuleId,
  fileError,
  fileWarn,
  toText,
  type GenericNode,
  type GenericParent,
} from 'myst-common';
import { select, selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import type { ResolvedExternalReference } from './types.js';

export function checkLinkTextTransform(
  mdast: GenericParent,
  externalReferences: ResolvedExternalReference[],
  vfile: VFile,
) {
  const linkNodes = selectAll('link,linkBlock,card', mdast) as GenericNode[];
  const xrefNodes = selectAll('crossReference', mdast) as GenericNode[];
  linkNodes.forEach((node) => {
    if (node.url && (node.url.startsWith('xref:') || node.url.startsWith('myst:'))) {
      const key = node.url.slice(5).split('/')[0].split('#')[0];
      if (externalReferences.map((ref) => ref.key).includes(key)) {
        // If this link has an existing reference key but did not resolve, another error was already raised
      } else {
        fileError(vfile, `Link did not resolve to valid cross-reference: ${node.url}`, {
          node,
          ruleId: RuleId.linkTextExists,
          note: key ? `You need an entry in your project references with key "${key}"` : undefined,
        });
      }
    } else if (!toText(node.children) && !select('image', node)) {
      const url = node.urlSource ?? node.url;
      fileWarn(
        vfile,
        `Link text is empty for <${url}${node.identifier && node.identifier !== url ? `#${node.identifier}` : ''}>`,
        {
          node,
          ruleId: RuleId.linkTextExists,
        },
      );
    }
  });
  xrefNodes.forEach((node) => {
    if (!toText(node.children) && !select('image', node)) {
      fileWarn(vfile, `Cross reference text is empty for <${node.urlSource}>`, {
        node,
        ruleId: RuleId.linkTextExists,
      });
    }
  });
}
