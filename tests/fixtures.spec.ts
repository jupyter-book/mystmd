import { getFixtures, getTokenizer } from './build';

const tokenizer = getTokenizer();


describe('Basic', () => {
  getFixtures('markdown.generic').forEach(([name, md, html]) => {
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
});

describe('Blocks', () => {
  getFixtures('blocks.target').forEach(([name, md, html]) => {
    it(name, () => expect(tokenizer.render(md)).toEqual(`${html}\n`));
  });
});
