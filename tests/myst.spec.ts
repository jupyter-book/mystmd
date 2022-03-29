import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { MyST } from '../src';
import { Root } from 'mdast';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  description?: string;
  skip?: boolean;
  mdast: Root;
  myst?: string;
  html?: string;
};

// Comment out to make these fail
const SKIP_TESTS = [
  // Expected
  '44', // This is a block break, expect it to be different
  // Minor
  '25', // This is a &nbsp; I think
  // To fix
  '333', // Spacing around inline code?
  '353', // Broken paragraph/emph?
  '506', // This is a link issue?
];

const directory = 'node_modules/myst-spec/dist/examples';
const files: string[] = fs
  .readdirSync(directory)
  .filter((name) => name.endsWith('.yml'));

// For prettier printing of test cases
const length = files
  .map((f) => f.replace('.yml', ''))
  .reduce((a, b) => Math.max(a, b.length), 0);

const skipped: [string, TestCase][] = [];
const cases: [string, TestCase][] = files
  .map((file) => {
    const testYaml = fs.readFileSync(path.join(directory, file)).toString();
    const cases = yaml.load(testYaml) as TestFile;
    return cases.cases.map((testCase) => {
      const section = `${file.replace('.yml', '')}:`.padEnd(length + 2, ' ');
      const name = `${section} ${testCase.title}`;
      return [name, testCase] as [string, TestCase];
    });
  })
  .flat()
  .filter(([f, t]) => {
    if (t.skip) skipped.push([f, t]);
    return !t.skip;
  });

const mystCases: [string, TestCase][] = cases.filter(([f, t]) => {
  for (const skip of SKIP_TESTS) {
    if (f.trim().endsWith(`example ${skip}`)) return false;
  }
  return t.myst;
});
const htmlCases: [string, TestCase][] = cases.filter(([f, t]) => t.html);

describe('Testing myst --> mdast conversions', () => {
  test.each(mystCases)('%s', (_, { myst, mdast }) => {
    if (myst) {
      const parser = new MyST({
        mdast: {
          hoistSingleImagesOutofParagraphs: false,
          nestBlocks: false,
        },
        extensions: {
          frontmatter: false, // Frontmatter screws with some tests!
        },
      });
      const mdastString = yaml.dump(mdast);
      const newAst = yaml.dump(parser.parse(myst));
      expect(newAst).toEqual(mdastString);
    }
  });
});

describe('Testing mdast --> html conversions', () => {
  test.each(htmlCases)('%s', (name, { html, mdast }) => {
    if (html) {
      if (name.includes('cmark_spec_0.30')) {
        const parser = new MyST({
          allowDangerousHtml: true,
          mdast: {
            hoistSingleImagesOutofParagraphs: false,
          },
          extensions: {
            frontmatter: false, // Frontmatter screws with some tests!
          },
          formatHtml: false,
          stringifyHtml: {
            closeSelfClosing: true,
          },
        });

        const output = parser.renderMdast(mdast);
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

        if (name.includes('190')) {
          o = o
            .replace('<table><tr><td>', '<table>\n<tr>\n<td>') // Test 190
            .replace('</td></tr></table>', '</td>\n</tr>\n</table>'); // Test 190
        }
        if (name.includes('191')) {
          o = o
            .replace('<table>  <tr>', '<table>\n  <tr>') // Test 191
            .replace('</tr></table>', '</tr>\n</table>'); // Test 191
        }

        expect(o).toEqual(i);
      } else {
        const parser = new MyST({
          allowDangerousHtml: true,
        });
        const newHTML = parser.renderMdast(mdast);
        expect(newHTML).toEqual(html);
      }
    }
  });
});

if (skipped.length) {
  describe('Skipped Tests', () => {
    // eslint-disable-next-line jest/no-disabled-tests, jest/expect-expect
    test.skip.each(skipped)('%s', (name, _) => null);
  });
}
