import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Parent, Heading } from 'myst-spec';
import { liftChildren } from 'myst-common';

export type Section = Omit<Heading, 'type'> & { type: 'section' };

export function sectionTransform(tree: Root) {
  liftChildren(tree, 'block'); // this looses part information
  const children: Parent[] = [];
  let current: Section | undefined = undefined;
  function push(child: any) {
    if (current) {
      current.children.push(child);
    } else {
      children.push(child);
    }
  }
  function newSection(heading: Heading) {
    const { enumerator, enumerated, ...filtered } = heading;
    if (current && current.depth < heading.depth) {
      // Nest the section
      const next: Section = { ...filtered, type: 'section', children: [] };
      push(next);
      current = next;
      return { enumerator, enumerated };
    }
    current = { ...filtered, type: 'section', children: [] };
    children.push(current);
    return { enumerator, enumerated };
  }
  tree.children.forEach((child) => {
    if (child.type === 'heading') {
      const { enumerator, enumerated } = newSection(child as Heading);
      push({ type: 'heading', enumerator, enumerated, children: child.children });
    } else {
      push(child);
    }
  });
  tree.children = children as any;
}

export const sectionPlugin: Plugin<[], Root, Root> = () => (tree) => {
  sectionTransform(tree);
};
