import { unified } from 'unified';
import type { JatsResult } from '../src';
import mystToJats from '../src';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  tree: string;
  jats: string;
  frontmatter?: Record<string, any>;
};

const directory = path.join('tests');

function loadCases(file: string) {
  const testYaml = fs.readFileSync(path.join(directory, file)).toString();
  return (yaml.load(testYaml) as TestFile).cases;
}

describe('Basic JATS body', () => {
  const cases = loadCases('basic.yml');
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))('%s', (_, { tree, jats }) => {
    const pipe = unified().use(mystToJats);
    pipe.runSync(tree as any);
    const vfile = pipe.stringify(tree as any);
    expect((vfile.result as JatsResult).value).toEqual(jats);
  });
});

describe('JATS full article', () => {
  const cases = loadCases('article.yml');
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    (_, { tree, jats, frontmatter }) => {
      const pipe = unified().use(mystToJats, { frontmatter, fullArticle: true, spaces: 2 });
      pipe.runSync(tree as any);
      const vfile = pipe.stringify(tree as any);
      expect((vfile.result as JatsResult).value).toEqual(jats);
    },
  );
});
