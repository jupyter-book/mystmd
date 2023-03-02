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

// function createFigureCrossReference(figureNumber: string, figureNodes: Container[]) {}

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
          const { identifier } = figureNodes.find((n) => n.enumerator === singleNumber) || {};
          if (!identifier) {
            fileWarn(
              file,
              `Unable to find figure number "${singleNumber}" from text "${match[0]}"`,
            );
            return;
          }
          children.push(u('text', node.value.substring(firstIndex, match.index) + start));
          firstIndex = figureRegex.lastIndex;
          children.push(
            u(
              'crossReference',
              {
                identifier,
                label: identifier,
                kind: 'figure',
              },
              [u('text', singlePrefix + singleNumber)],
            ),
          );
        } else if (prefix && firstNumber && middle && secondNumber) {
          // TODO: two figures!
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
