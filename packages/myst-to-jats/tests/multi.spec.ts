import type { JatsResult } from '../src';
import { writeMultiArticleJats } from '../src';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { VFile } from 'vfile';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  frontmatter: Record<string, any>;
  articles: {
    mdast: Record<string, any>;
    frontmatter?: Record<string, any>;
    citations?: Record<string, any>;
  }[];
  jats: string;
};

const directory = path.join('tests');

function loadCases(file: string) {
  const testYaml = fs.readFileSync(path.join(directory, file)).toString();
  return (yaml.load(testYaml) as TestFile).cases;
}

describe('JATS multi-article', () => {
  const cases = loadCases('multi.yml');
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    (_, { articles, jats, frontmatter }) => {
      const vfile = writeMultiArticleJats(new VFile(), articles as any, {
        frontmatter,
        fullArticle: true,
        spaces: 2,
      });
      expect((vfile.result as JatsResult).value).toEqual(jats);
    },
  );
});
