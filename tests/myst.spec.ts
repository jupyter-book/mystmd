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
  myst: string;
  html: string;
};

const directory = 'tests/myst';
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

describe('Testing myst --> mdast conversions', () => {
  test.each(cases)('%s', (_, { myst, mdast }) => {
    const parser = new MyST();
    const mdastString = yaml.dump(mdast);
    const newAst = yaml.dump(parser.parse(myst));
    expect(newAst).toEqual(mdastString);
  });
});

describe('Testing mdast --> html conversions', () => {
  test.each(cases)('%s', (_, { html, mdast }) => {
    const parser = new MyST({ allowDangerousHtml: true });
    const newHTML = parser.renderMdast(mdast);
    expect(newHTML).toEqual(html);
  });
});

describe('Skipped Tests', () => {
  // eslint-disable-next-line jest/no-disabled-tests, jest/expect-expect
  test.skip.each(skipped)('%s', () => null);
});
