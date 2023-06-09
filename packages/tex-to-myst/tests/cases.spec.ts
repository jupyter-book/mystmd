import { describe, expect, test, vi } from 'vitest';
import { VFile } from 'vfile';
import { TexParser } from '../src';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { toText } from 'myst-common';
import { stripPositions } from '../src/utils';

vi.mock('myst-common', async () => {
  const actual = (await vi.importActual('myst-common')) as any;
  return { ...actual, createId: vi.fn(() => 'someRandomId') };
});

type TestFile = {
  title: string;
  cases: TestCase[];
};
type TestCase = {
  title: string;
  tex: string;
  tree?: string;
  text?: string;
  warnings?: number;
  opts?: Record<string, boolean>;
  data?: Partial<TexParser['data']>;
};

const directory = path.join('tests');
const files = [
  'text.yml',
  'citations.yml',
  'characters.yml',
  'lists.yml',
  'sections.yml',
  'links.yml',
  'refs.yml',
  'math.yml',
  'colors.yml',
  'packages.yml',
  'commands.yml',
  'figures.yml',
  'frontmatter.yml',
  'tables.yml',
  'footnotes.yml',
  'siunitx.yml',
];

const only = ''; // Can set this to a test title

const casesList = files
  .map((file) => ({ name: file, data: fs.readFileSync(path.join(directory, file)).toString() }))
  .map((file) => {
    const tests = yaml.load(file.data) as TestFile;
    tests.title = tests.title ?? file.name;
    return tests;
  });

casesList.forEach(({ title, cases }) => {
  describe(title, () => {
    const casesToUse = cases.filter((c) => !only || c.title === only);
    if (casesToUse.length === 0) return;
    test.each(casesToUse.map((c): [string, TestCase] => [c.title, c]))(
      '%s',
      (_, { tex, tree, text, warnings, data }) => {
        const vfile = new VFile();
        const state = new TexParser(tex, vfile);
        if (only) {
          // This runs in "only" mode
          console.log(yaml.dump(stripPositions(state.raw)));
          console.log(yaml.dump(stripPositions(state.ast)));
        }
        stripPositions(state.ast);
        if (vfile.messages.length !== (warnings ?? 0)) {
          console.log(vfile.messages);
        }
        if (tree) expect(state.ast).toEqual(tree);
        else if (text != null) expect(toText(state.ast)).toEqual(text);
        else throw new Error('Must have at least "tree" or "text" defined.');
        if (data?.colors) {
          expect(state.data.colors).toEqual(data.colors);
        }
        if (data?.packages) {
          expect(state.data.packages).toEqual(data.packages);
        }
        if (data?.macros) {
          expect(state.data.macros).toEqual(data.macros);
        }
        if (data?.frontmatter) {
          stripPositions(state.data.frontmatter.title);
          stripPositions(state.data.frontmatter.short_title);
          expect(state.data.frontmatter).toEqual(data.frontmatter);
        }
        if (data?.maketitle != null) {
          expect(state.data.maketitle).toEqual(data.maketitle);
        }
        if (data?.appendix != null) {
          expect(state.data.appendix).toEqual(data.appendix);
        }
        expect(vfile.messages.length).toBe(warnings ?? 0);
      },
    );
  });
});
