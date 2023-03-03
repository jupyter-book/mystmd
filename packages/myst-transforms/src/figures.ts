import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { GenericNode } from 'myst-common';
import { fileWarn, liftChildren } from 'myst-common';
import type { Container } from 'myst-spec';
import { u } from 'unist-builder';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';

const START_RE = '(?<start>^|[^a-zA-Z0-9])';
const FIGURE_PLURAL_PREFIX_RE = '(?<prefix>fig(s|(ures{0,1})|(s{0,1}\\.)){0,1} {0,1})';
const FIGURE_PLURAL_FIRST_RE = '(?<firstNumber>[0-9]+)';
const FIGURE_PLURAL_MIDDLE_RE = '(?<middle>[a-zA-Z]{0,1} {0,1}((to)|(and)|&|-|—|,) {0,1})';
const FIGURE_PLURAL_SECOND_RE = '(?<secondNumber>[0-9]+)';
const FIGURE_SINGLE_PREFIX_RE = '(?<singlePrefix>fig((ure)|\\.){0,1} {0,1})';
const FIGURE_SINGLE_NUMBER_RE = '(?<singleNumber>[0-9]+)';
// const FIGURE_UNKNOWN_REFERENCE_RE = '(?<figureRef>fig(s|(ures{0,1})|(s{0,1}\\.)){0,1} {0,1})';
// const END_RE = '($|[^a-zA-Z0-9])';

// Matches for example: Figures 1 to 5, figs. 14 & 17, FIG6a-6d
const FIGURE_PLURAL_RE = `${FIGURE_PLURAL_PREFIX_RE}${FIGURE_PLURAL_FIRST_RE}${FIGURE_PLURAL_MIDDLE_RE}${FIGURE_PLURAL_SECOND_RE}`;
// Matches for example: Figure 1, fig. 27, FIG4
const FIGURE_SINGLE_RE = `${FIGURE_SINGLE_PREFIX_RE}${FIGURE_SINGLE_NUMBER_RE}`;
// Matches any standalone mention of "figure" - only to be used with interactive input
// const FIGURE_UNKNOWN_RE = `${START_RE}${FIGURE_UNKNOWN_REFERENCE_RE}${END_RE}`;

const FIGURE_RE = `${START_RE}((${FIGURE_PLURAL_RE})|(${FIGURE_SINGLE_RE}))`;

function figureNodeFromNumber(
  figureNumber: string,
  figureNodes: Container[],
  match: string,
  file: VFile,
) {
  let figureNode = figureNodes.find((n) => n.enumerator === figureNumber);
  if (figureNode) return figureNode;
  figureNode = figureNodes.find((n) => n.enumerator === `${Number(figureNumber)}`);
  if (figureNode) return figureNode;
  figureNode = figureNodes.find((n) => n.identifier === figureNumber);
  if (figureNode) return figureNode;
  fileWarn(file, `Unable to find figure number "${figureNumber}" from text "${match}"`);
}

function createFigureCrossRef(
  prefix: string,
  number: string,
  figureNodes: Container[],
  match: string,
  file: VFile,
) {
  const figureNode = figureNodeFromNumber(number, figureNodes, match, file);
  if (!figureNode) return;
  const { identifier } = figureNode;
  const crossReferenceNode = u(
    'crossReference',
    {
      identifier,
      label: identifier,
      kind: 'figure',
    },
    [u('text', prefix + number)],
  );
  return crossReferenceNode;
}

/**
 * Convert text like "Figure 1" to a figure cross reference
 *
 * Examples:
 *
 * - Figure 1
 * - fig. 27
 * - FIG4
 */
export function figureTextTransform(tree: Root, file: VFile) {
  const containerNodes = selectAll('container', tree) as Container[];
  const figureNodes = containerNodes.filter((n) => n.kind === 'figure');
  const textNodes = selectAll('text', tree) as GenericNode[];
  textNodes
    .filter((n) => !selectAll('crossReference text', tree).includes(n))
    .forEach((node: GenericNode) => {
      if (!node.value) return;
      const children: GenericNode[] = [];
      let match: RegExpExecArray | null;
      let firstIndex = 0;
      const figureRegex = new RegExp(FIGURE_RE, 'gi');
      while ((match = figureRegex.exec(node.value))) {
        const groups = match.groups || {};
        let { start } = groups;
        if (!start) start = '';
        const { singlePrefix, singleNumber, prefix, firstNumber, middle, secondNumber } = groups;
        if (singlePrefix && singleNumber) {
          const crossRefNode = createFigureCrossRef(
            singlePrefix,
            singleNumber,
            figureNodes,
            match[0],
            file,
          );
          if (!crossRefNode) continue;
          children.push(
            u('text', node.value.substring(firstIndex, match.index) + start),
            crossRefNode,
          );
          firstIndex = figureRegex.lastIndex;
        } else if (prefix && firstNumber && middle && secondNumber) {
          const firstCrossRefNode = createFigureCrossRef(
            prefix,
            firstNumber,
            figureNodes,
            match[0],
            file,
          );
          const secondCrossRefNode = createFigureCrossRef(
            '',
            secondNumber,
            figureNodes,
            match[0],
            file,
          );
          if (firstCrossRefNode && secondCrossRefNode) {
            children.push(
              u('text', node.value.substring(firstIndex, match.index) + start),
              firstCrossRefNode,
              u('text', middle),
              secondCrossRefNode,
            );
            firstIndex = figureRegex.lastIndex;
          } else if (firstCrossRefNode) {
            children.push(
              u('text', node.value.substring(firstIndex, match.index) + start),
              firstCrossRefNode,
            );
            firstIndex = figureRegex.lastIndex - (middle + secondNumber).length;
          } else if (secondCrossRefNode) {
            children.push(
              u(
                'text',
                node.value.substring(firstIndex, match.index) +
                  start +
                  prefix +
                  firstNumber +
                  middle,
              ),
              secondCrossRefNode,
            );
            firstIndex = figureRegex.lastIndex;
          }
        }
      }
      if (!children.length) return;
      if (firstIndex < node.value.length) {
        children.push(u('text', node.value.substring(firstIndex)));
      }
      node.type = '_lift';
      node.children = children;
    });
  liftChildren(tree, '_lift');
}

export const figureTextPlugin: Plugin<[], Root, Root> = () => (tree, file) => {
  figureTextTransform(tree, file);
};
