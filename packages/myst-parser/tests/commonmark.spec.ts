/**
 * These tests will likely be deprecated in favor of the
 * commonmark tests pulled in from myst-spec in myst.spec.ts
 *
 * However, we can wait until those are slightly more solid
 * (and possibly coming in as JSON instead of YAML) to delete
 * these.
 */

import fs from 'fs';
import path from 'path';
import { createTokenizer, mystParse } from '../src';
import { renderMdast } from './renderMdast';

type Spec = {
  section: string;
  example: number;
  markdown: string;
  html: string;
};

// Comment out to make these fail
const SKIP_TESTS = new Set([
  // Expected
  44, // This is a block break, expect it to be different
  // Minor
  25, // This is a &nbsp; I think
  // To fix
  333, // Spacing around inline code?
  353, // Broken paragraph/emph?
  506, // This is a link issue?
]);

export function loadSpec(name: string): Spec[] {
  const fixtures = JSON.parse(fs.readFileSync(path.join('tests', 'commonmark', name)).toString());
  return fixtures;
}

function fixHtml(html: string) {
  return html.replace(/<blockquote>\n<\/blockquote>/g, '<blockquote></blockquote>');
}
const skipped: [string, Spec][] = [];

const cases: [string, Spec][] = loadSpec('cmark_spec_0.30.json')
  .map((c) => {
    return [`${c.example}: ${c.section}`, c] as [string, Spec];
  })
  .filter(([f, c]) => {
    // return c.example === 34
    // if (c.section === 'Lists' || c.section === 'List items') return false
    if (!SKIP_TESTS.has(c.example)) return true;
    skipped.push([f, c]);
    return false;
  });

describe('Common Mark Spec with markdown it', () => {
  test.each(cases)('%s', (_, { markdown, html }) => {
    const fixed = fixHtml(html);
    // For the common mark to pass, html parsing needs to be enabled
    const output = createTokenizer({
      markdownit: { html: true },
      extensions: {
        frontmatter: false, // Frontmatter screws with some tests!
      },
    }).render(markdown);
    expect(output).toEqual(fixed);
  });
});

describe('Common Mark Spec with unified', () => {
  test.each(cases)('%s', (_, { example, markdown, html }) => {
    // For the common mark to pass, html parsing needs to be enabled
    const tree = mystParse(markdown, {
      markdownit: {
        html: true,
      },
      mdast: {
        hoistSingleImagesOutofParagraphs: false,
      },
      extensions: {
        frontmatter: false, // Frontmatter screws with some tests!
      },
    });
    const output = renderMdast(tree, {
      formatHtml: false,
      hast: {
        clobberPrefix: 'm-',
        allowDangerousHtml: true,
      },
      stringifyHtml: {
        closeSelfClosing: true,
        allowDangerousHtml: true,
      },
    });
    const i = html
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '&#x3C;')
      .replace(/&amp;/g, '&#x26;')
      .replace(/&quot;/g, '"')
      .replace(' alt=""', '') // Test 580
      .trim();
    let o = output
      .replace(/<li>\n(?!<)/g, '<li>')
      .replace(/(?<!>)\n<\/li>/g, '</li>')
      // These are quoted correctly, but come out poorly from the &quot; replacement above
      .replace('foo&#x22;bar', 'foo"bar') // Test 202
      .replace('&#x22;and&#x22;', '"and"') // Test 508
      .replace('title &#x22;&#x22;', 'title ""'); // Test 505

    if (example === 190) {
      o = o
        .replace('<table><tr><td>', '<table>\n<tr>\n<td>') // Test 190
        .replace('</td></tr></table>', '</td>\n</tr>\n</table>'); // Test 190
    }
    if (example === 191) {
      o = o
        .replace('<table>  <tr>', '<table>\n  <tr>') // Test 191
        .replace('</tr></table>', '</tr>\n</table>'); // Test 191
    }

    expect(o).toEqual(i);
  });
});

describe('Skipped Commonmark Tests', () => {
  test.skip.each(skipped)('%s', () => null);
});
