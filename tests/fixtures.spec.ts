import MyST from '../src';
import { getFixtures } from './build';

const tokenizer = MyST();


describe('Basic', () => {
  getFixtures('markdown.generic').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
});

describe('Math', () => {
  getFixtures('markdown.math').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
});

describe('Roles', () => {
  getFixtures('roles.generic').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
  getFixtures('roles.known').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
});

describe('Directives', () => {
  getFixtures('directives.known').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
  getFixtures('directives.figure').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
});

describe('Blocks', () => {
  getFixtures('blocks.target').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
  getFixtures('blocks.comment').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
  getFixtures('blocks.break').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
});


describe('Examples', () => {
  getFixtures('examples.admonitions').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
});
