import { describe, expect, it, beforeEach, vi } from 'vitest';
import memfs from 'memfs';
import { Session } from '../session';
import { projectFromPath } from './fromPath';
import { pagesFromSphinxTOC, projectFromSphinxTOC } from './fromTOC';
import { tocFromProject } from './toTOC';
import { handleDeprecatedFields } from './config';
import { VFile } from 'vfile';

describe('config file coercion', () => {
  it('site frontmatter is lifted', async () => {
    const vfile = new VFile();
    const conf = { site: { frontmatter: { a: 1 }, other: true } };
    handleDeprecatedFields(conf, '', vfile);
    expect(conf).toEqual({ site: { a: 1, other: true } });
    expect(vfile.messages.length).toBe(1);
  });
  it('project frontmatter is lifted', async () => {
    const vfile = new VFile();
    const conf = { project: { frontmatter: { a: 1 }, other: true } };
    handleDeprecatedFields(conf, '', vfile);
    expect(conf).toEqual({ project: { a: 1, other: true } });
    expect(vfile.messages.length).toBe(1);
  });
  it('site logoText is renamed logo_text', async () => {
    const vfile = new VFile();
    const conf = { site: { logoText: 'my logo', other: true } };
    handleDeprecatedFields(conf, '', vfile);
    expect(conf).toEqual({ site: { logo_text: 'my logo', other: true } });
    expect(vfile.messages.length).toBe(1);
  });
  it('project biblio is lifted', async () => {
    const vfile = new VFile();
    const conf = {
      project: {
        biblio: { volume: 12, issue: 'spring', first_page: 1, last_page: 100 },
        other: true,
      },
    };
    handleDeprecatedFields(conf, '', vfile);
    expect(conf).toEqual({
      project: {
        volume: 12,
        issue: 'spring',
        first_page: 1,
        last_page: 100,
        other: true,
      },
    });
    expect(vfile.messages.length).toBe(1);
  });
});
