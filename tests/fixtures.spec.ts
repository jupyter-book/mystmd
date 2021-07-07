import { MyST } from '../src_archive';
import { getFixtures } from './build';

const tokenizer = MyST();


describe('Basic', () => {
  getFixtures('markdown.basic').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
});

describe('Math', () => {
  getFixtures('math').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
  getFixtures('directives.math').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
  getFixtures('math.ams').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
  getFixtures('math.ams.integration').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
});

describe('Roles', () => {
  getFixtures('roles.generic').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
  getFixtures('roles.html').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
  getFixtures('roles.references').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
});

describe('Directives', () => {
  getFixtures('directives.admonitions').forEach(([name, md, html]) => {
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
