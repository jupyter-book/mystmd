import yaml from 'js-yaml';
import { Root } from 'mdast';

export function getFrontmatter(
  tree: Root,
  remove = true,
): Record<string, any> | undefined {
  const possibleYaml = tree.children[0];
  if (possibleYaml?.type !== 'code' || possibleYaml?.lang !== 'yaml') return undefined;
  const data = yaml.load(possibleYaml.value) as Record<string, any>;
  if (remove) tree.children.splice(0, 1);
  return data;
}
