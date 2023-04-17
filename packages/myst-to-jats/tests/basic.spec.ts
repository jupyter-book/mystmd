import { unified } from 'unified';
import fs from 'fs';
import { Session, silentLogger } from 'myst-cli-utils';
import path from 'path';
import { validateJatsAgainstDtd } from 'jats-xml';
import yaml from 'js-yaml';
import { VFile } from 'vfile';
import mystToJats, { writeJats } from '../src';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  jats: string;
  tree: Record<string, any>;
  frontmatter?: Record<string, any>;
  citations?: Record<string, any>;
  subArticles: {
    mdast: Record<string, any>;
    frontmatter?: Record<string, any>;
    citations?: Record<string, any>;
  }[];
};

const directory = path.join('tests');

function loadCases(file: string) {
  const testYaml = fs.readFileSync(path.join(directory, file)).toString();
  return (yaml.load(testYaml) as TestFile).cases;
}

const testLogger = new Session({
  logger: {
    ...silentLogger(),
    error: (...args: any) => {
      console.error(...args);
    },
  },
});

async function writeValidateDelete(data: string) {
  const testXml = path.join(__dirname, 'test.xml');
  fs.writeFileSync(testXml, data);
  const valid = await validateJatsAgainstDtd(testLogger, testXml);
  fs.rmSync(testXml);
  return valid;
}

describe('Basic JATS body', () => {
  const cases = loadCases('basic.yml');
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))('%s', (_, { tree, jats }) => {
    const pipe = unified().use(mystToJats);
    pipe.runSync(tree as any);
    const vfile = pipe.stringify(tree as any);
    expect(vfile.result).toEqual(jats);
  });
});

describe('JATS full article', () => {
  const cases = loadCases('article.yml');
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    async (_, { tree, jats, frontmatter, citations }) => {
      const pipe = unified().use(mystToJats, frontmatter, citations, {
        fullArticle: true,
        spaces: 2,
      });
      pipe.runSync(tree as any);
      const vfile = pipe.stringify(tree as any);
      expect(vfile.result).toEqual(jats);
      expect(await writeValidateDelete(vfile.result as string)).toBeTruthy();
    },
  );
});

describe('JATS full article with bibliography', () => {
  const cases = loadCases('citations.yml');
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    async (_, { tree, jats, frontmatter, citations }) => {
      const pipe = unified().use(mystToJats, frontmatter, citations, {
        fullArticle: true,
        spaces: 2,
      });
      pipe.runSync(tree as any);
      const vfile = pipe.stringify(tree as any);
      expect(vfile.result).toEqual(jats);
      expect(await writeValidateDelete(vfile.result as string)).toBeTruthy();
    },
  );
});

describe('JATS multi-article', () => {
  const cases = loadCases('multi.yml');
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    async (_, { tree, jats, frontmatter, citations, subArticles }) => {
      const vfile = writeJats(
        new VFile(),
        { mdast: tree as any, frontmatter, citations },
        {
          subArticles: subArticles as any,
          fullArticle: true,
          spaces: 2,
        },
      );
      expect(vfile.result).toEqual(jats);
      expect(await writeValidateDelete(vfile.result as string)).toBeTruthy();
    },
  );
});

describe('JATS SI units', () => {
  const cases = loadCases('siunit.yml');
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    (_, { tree, jats, frontmatter, citations }) => {
      const vfile = writeJats(
        new VFile(),
        { mdast: tree as any, frontmatter, citations },
        {
          fullArticle: false,
        },
      );
      expect(vfile.result).toEqual(jats);
    },
  );
});
