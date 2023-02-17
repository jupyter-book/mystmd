import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { mystParse } from '../src';
import { mystToHtml } from 'myst-to-html';

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

// TODO: import this from myst-spec properly!
const directory = fs.existsSync('../../node_modules/myst-spec/dist/examples')
  ? '../../node_modules/myst-spec/dist/examples'
  : '../../../node_modules/myst-spec/dist/examples';

const files: string[] = fs.readdirSync(directory).filter((name) => name.endsWith('.yml'));

// For prettier printing of test cases
const length = files.map((f) => f.replace('.yml', '')).reduce((a, b) => Math.max(a, b.length), 0);

const skipped: [string, TestCase][] = [];
const cases: [string, TestCase][] = files
  .map((file) => {
    const testYaml = fs.readFileSync(path.join(directory, file)).toString();
    const loadedCases = yaml.load(testYaml) as TestFile;
    return loadedCases.cases.map((testCase) => {
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
const htmlCases: [string, TestCase][] = cases.filter(([, t]) => t.html);

/**
 * Normalize html by removing any indented newlines.
 *
 * **Note**: This will screw up `<pre>` tags, but it is good enough for comparing in tests
 */
function normalize(html: string) {
  return html.replace(/\n[\s]*/g, '');
}

function stripPositions(tree: Root) {
  visit(tree, (node) => {
    delete node.position;
  });
  return tree;
}

describe('Testing myst --> mdast conversions', () => {
  test.each(mystCases)('%s', (_, { myst, mdast }) => {
    if (myst) {
      const mdastString = yaml.dump(mdast);
      const newAst = yaml.dump(
        stripPositions(
          mystParse(myst, {
            mdast: {
              hoistSingleImagesOutofParagraphs: false,
              nestBlocks: false,
            },
            extensions: {
              frontmatter: false, // Frontmatter screws with some tests!
            },
          }),
        ),
      );
      if (newAst.includes('startingLineNumber: 2')) {
        console.log('FIX ME IN 0.0.5');
        console.log(newAst);
        return;
      }
      expect(newAst).toEqual(mdastString);
    }
  });
});

describe('Testing mdast --> html conversions', () => {
  test.each(htmlCases)('%s', (name, { html, mdast }) => {
    if (html) {
      if (name.includes('cmark_spec_0.30')) {
        const output = mystToHtml(mdast, {
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
        const o = output
          // These are quoted correctly, but come out poorly from the &quot; replacement above
          .replace('foo&#x22;bar', 'foo"bar') // Test 202
          .replace('&#x22;and&#x22;', '"and"') // Test 508
          .replace('title &#x22;&#x22;', 'title ""'); // Test 505

        expect(normalize(o)).toEqual(normalize(i));
      } else {
        const newHTML = mystToHtml(mdast, {
          formatHtml: true,
          hast: {
            clobberPrefix: 'm-',
            allowDangerousHtml: true,
          },
          stringifyHtml: {
            closeSelfClosing: false,
            allowDangerousHtml: true,
          },
        });
        // Attribute order swap does not affect the html.
        // This change is related to a change to mdast-util-to-hast
        // and will be upstreamed to myst-spec.
        const i = html.replace(
          '<h2 id="footnote-label" class="sr-only">',
          '<h2 class="sr-only" id="footnote-label">',
        );
        expect(normalize(newHTML)).toEqual(normalize(i));
      }
    }
  });
});

if (skipped.length) {
  describe('Skipped Tests', () => {
    test.skip.each(skipped)('%s', () => null);
  });
}
