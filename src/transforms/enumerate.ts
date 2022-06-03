import { GenericNode, selectAll } from 'mystjs';
import { ProjectFrontmatter } from '../frontmatter/types';
import { Root } from '../myst';

export function transformEnumerators(
  mdast: Root,
  frontmatter: Pick<ProjectFrontmatter, 'numbering'>,
) {
  const { numbering } = frontmatter;
  if (numbering === true || numbering == null) return;
  if (numbering === false) {
    const numbered = selectAll('[enumerator]', mdast) as GenericNode[];
    numbered.forEach((node) => {
      node.enumerate = false;
      delete node.enumerator;
    });
    return;
  }
  const { enumerator } = numbering;
  const numbered = selectAll('[enumerator]', mdast) as GenericNode[];
  numbered.forEach((node) => {
    if (
      (node.type === 'heading' &&
        numbering[`heading_${node.depth}` as keyof typeof numbering] === false) ||
      numbering[node.type as keyof typeof numbering] === false ||
      numbering[node.kind as keyof typeof numbering] === false
    ) {
      node.enumerate = false;
      delete node.enumerator;
      return;
    }
    if (!enumerator || typeof enumerator !== 'string') return;
    node.enumerator = enumerator.replace(/%s/g, node.enumerator);
  });
}
