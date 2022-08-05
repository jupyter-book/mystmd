import type { GenericNode } from 'mystjs';
import { selectAll } from 'mystjs';
import type { Numbering, ProjectFrontmatter } from '../frontmatter/types';
import type { Root } from '../myst';

const DEFAULT_NUMBERING: Numbering = {
  figure: true,
  equation: true,
  table: true,
  code: true,
  heading_1: false,
  heading_2: false,
  heading_3: false,
  heading_4: false,
  heading_5: false,
  heading_6: false,
};

export function transformEnumerators(
  mdast: Root,
  frontmatter: Pick<ProjectFrontmatter, 'numbering'>,
) {
  const { numbering } = frontmatter;
  if (numbering === true) return;
  if (numbering === false) {
    const numbered = selectAll('[enumerator]', mdast) as GenericNode[];
    numbered.forEach((node) => {
      node.enumerate = false;
      delete node.enumerator;
    });
    return;
  }
  const useNumbering = numbering ?? DEFAULT_NUMBERING;
  const numbered = selectAll('[enumerator]', mdast) as GenericNode[];
  numbered.forEach((node) => {
    if (
      (node.type === 'heading' &&
        useNumbering[`heading_${node.depth}` as keyof typeof useNumbering] === false) ||
      useNumbering[node.type as keyof typeof useNumbering] === false ||
      useNumbering[node.kind as keyof typeof useNumbering] === false
    ) {
      node.enumerate = false;
      delete node.enumerator;
      return;
    }
    if (!useNumbering.enumerator || typeof useNumbering.enumerator !== 'string') return;
    node.enumerator = useNumbering.enumerator.replace(/%s/g, node.enumerator);
  });
}
