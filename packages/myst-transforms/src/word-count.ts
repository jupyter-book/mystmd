import type { Plugin } from 'unified';
import { selectAll } from 'unist-util-select';
import type { GenericNode, GenericParent } from 'myst-common';

export function wordCountTransform(tree: GenericParent) {
  const textNodes = selectAll('text', tree) as GenericNode[];
  const numWords = textNodes
    // Split by space
    .map((node) => (node.value as string).split(' '))
    // Filter punctuation-only words
    .map((words) => words.filter((word) => word.match(/[^.,:!?]/)))
    // Count words in each `Text` node
    .map((words) => words.length)
    // Sum together the counts
    .reduce((total, value) => total + value, 0);

  const countNodes = selectAll('wordCount', tree) as GenericParent[];
  countNodes.forEach((node) => {
    // Change the node type to text
    node.type = 'text';
    // Replace the number with the word count
    node.value = (node.value as string).replace('{number}', `${numWords}`);
  });
}

export const wordCountPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  wordCountTransform(tree);
};
