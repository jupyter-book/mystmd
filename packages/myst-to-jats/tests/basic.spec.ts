import { beforeEach, describe, expect, test } from 'vitest';
import { unified } from 'unified';
import fs from 'node:fs';
import { Session, silentLogger } from 'myst-cli-utils';
import { validateProjectFrontmatter } from 'myst-frontmatter';
import { SourceFileKind } from 'myst-spec-ext';
import type { ValidationOptions } from 'simple-validators';
import path from 'node:path';
import { validateJatsAgainstDtd } from 'jats-xml';
import yaml from 'js-yaml';
import { VFile } from 'vfile';
import mystToJats, { writeJats } from '../src';

const TEST_DTD = false;

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

function addHeader(data: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD with MathML3 v1.3 20210610//EN" "http://jats.nlm.nih.gov/publishing/1.3/JATS-archivearticle1-3-mathml3.dtd">
    <article xmlns:mml="http://www.w3.org/1998/Math/MathML" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ali="http://www.niso.org/schemas/ali/1.0/" dtd-version="1.3" xml:lang="en">
      <front>
        <article-meta/>
      </front>
      <body>
        ${data}
      </body>
    </article>`;
}

async function writeValidateDelete(data: string) {
  const testXml = path.join(__dirname, 'test.xml');
  fs.writeFileSync(testXml, data);
  const valid = await validateJatsAgainstDtd(testLogger, testXml);
  fs.rmSync(testXml);
  return valid;
}

let opts: ValidationOptions;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
});

describe('Basic JATS body', () => {
  const cases = [...loadCases('basic.yml'), ...loadCases('siunit.yml')];
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))('%s', async (_, { tree, jats }) => {
    const pipe = unified().use(mystToJats, SourceFileKind.Article);
    pipe.runSync(tree as any);
    const vfile = pipe.stringify(tree as any);
    expect(vfile.result).toEqual(jats);
    if (TEST_DTD) expect(await writeValidateDelete(addHeader(vfile.result as string))).toBeTruthy();
  });
});

describe('JATS full article', () => {
  const cases = [
    ...loadCases('affiliations.yml'),
    ...loadCases('article.yml'),
    ...loadCases('authors.yml'),
    ...loadCases('citations.yml'),
    ...loadCases('funding.yml'),
  ];
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    async (_, { tree, jats, frontmatter, citations }) => {
      const pipe = unified().use(
        mystToJats,
        SourceFileKind.Article,
        validateProjectFrontmatter(frontmatter, opts),
        citations,
        undefined,
        {
          writeFullArticle: true,
          spaces: 2,
        },
      );
      pipe.runSync(tree as any);
      const vfile = pipe.stringify(tree as any);
      expect(vfile.result).toEqual(jats);
      if (TEST_DTD) expect(await writeValidateDelete(vfile.result as string)).toBeTruthy();
    },
  );
});

describe('JATS multi-article', () => {
  const cases = loadCases('multi.yml');
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    async (_, { tree, jats, frontmatter, citations, subArticles }) => {
      subArticles.forEach((subArticle) => {
        subArticle.frontmatter = validateProjectFrontmatter(subArticle.frontmatter, opts);
      });
      const vfile = writeJats(
        new VFile(),
        {
          mdast: tree as any,
          kind: SourceFileKind.Article,
          frontmatter: validateProjectFrontmatter(frontmatter, opts),
          citations,
        },
        {
          subArticles: subArticles as any,
          writeFullArticle: true,
          spaces: 2,
        },
      );
      expect(vfile.result).toEqual(jats);
      if (TEST_DTD) expect(await writeValidateDelete(vfile.result as string)).toBeTruthy();
    },
  );
});

describe('JATS full notebook', () => {
  const cases = loadCases('notebooks.yml');
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    async (_, { tree, jats, frontmatter, citations }) => {
      const pipe = unified().use(
        mystToJats,
        SourceFileKind.Notebook,
        validateProjectFrontmatter(frontmatter, opts),
        citations,
        undefined,
        {
          writeFullArticle: true,
          spaces: 2,
        },
      );
      pipe.runSync(tree as any);
      const vfile = pipe.stringify(tree as any);
      expect(vfile.result).toEqual(jats);
      if (TEST_DTD) expect(await writeValidateDelete(vfile.result as string)).toBeTruthy();
    },
  );
});
