import { Author } from '@curvenote/blocks';
import yaml from 'js-yaml';
import { Root, PhrasingContent } from 'mdast';
import { GenericNode, select } from 'mystjs';

enum CreativeCommonsLicense {
  'CC0' = 'CC0-1.0',
  'CC-BY' = 'CC-BY-4.0',
  'CC-BY-SA' = 'CC-BY-SA-4.0',
  'CC-BY-NC' = 'CC-BY-NC-4.0',
  'CC-BY-NC-SA' = 'CC-BY-NC-SA-4.0',
  'CC-BY-ND' = 'CC-BY-ND-4.0',
  'CC-BY-NC-ND' = 'CC-BY-NC-ND-4.0',
}

export type Frontmatter = {
  title?: string;
  description?: string;
  authors?: Author[];
  subject?: string;
  open_access?: boolean;
  license?: CreativeCommonsLicense;
  doi?: string;
  github?: string;
  journal?: string | { title?: string; url?: string; volume?: number; issue?: number };
  numbering?:
    | boolean
    | {
        enumerator?: string;
        figure?: boolean;
        equation?: boolean;
        heading_1?: boolean;
        heading_2?: boolean;
        heading_3?: boolean;
        heading_4?: boolean;
        heading_5?: boolean;
        heading_6?: boolean;
      };
} & Record<string, string | boolean>;

function toText(content: PhrasingContent[]): string {
  return content
    .map((n) => {
      if ('value' in n) return n.value;
      if ('children' in n) return toText(n.children);
      return '';
    })
    .join('');
}

export function getFrontmatter(tree: Root, remove = true): Frontmatter {
  const firstNode = tree.children[0];
  const secondNode = tree.children[1];
  let removeUpTo = 0;
  let frontmatter: Frontmatter = {};
  const isYaml = firstNode?.type === 'code' && firstNode?.lang === 'yaml';
  if (isYaml) {
    frontmatter = yaml.load(firstNode.value) as Record<string, any>;
    removeUpTo += 1;
  }
  const maybeHeading = isYaml ? secondNode : firstNode;
  const isHeading = maybeHeading?.type === 'heading' && maybeHeading.depth === 1;
  if (isHeading) {
    frontmatter.title = toText(maybeHeading.children);
    removeUpTo += 1;
  }
  if (remove) tree.children.splice(0, removeUpTo);
  if (!frontmatter.title) {
    const heading = select('heading', tree) as GenericNode;
    // TODO: Improve title selection!
    frontmatter.title = heading?.children?.[0]?.value || 'Untitled';
  }
  return frontmatter;
}
