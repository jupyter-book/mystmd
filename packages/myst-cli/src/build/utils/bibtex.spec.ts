import { describe, expect, it } from 'vitest';
import { extractBibtex } from './bibtex';

describe('extractBibtex', () => {
  it('no key returns undefined', async () => {
    expect(extractBibtex('cite-key', 'bad bibtex data')).toEqual(undefined);
  });
  it('misformated key returns undefined', async () => {
    expect(extractBibtex('cite-key', '@article { cite-key }')).toEqual(undefined);
  });
  it('minimal entry returns', async () => {
    expect(extractBibtex('cite-key', '@article{cite-key}')).toEqual('@article{cite-key}');
  });
  it('minimal entry returns', async () => {
    expect(extractBibtex('cite-key', '@article{a}\n@article{cite-key}\n@article{b}')).toEqual(
      '@article{cite-key}',
    );
  });
  it('entry with nested brackets returns', async () => {
    expect(
      extractBibtex(
        'cite-key',
        '@article{a}\n@article{cite-key, \n\tabstract = {my abs},\n\ttitle = {test {title}}}\n@article{b}',
      ),
    ).toEqual('@article{cite-key, \n\tabstract = {my abs},\n\ttitle = {test {title}}}');
  });
  it('entry with mismatched brackets returns undefined', async () => {
    expect(
      extractBibtex(
        'cite-key',
        '@article{a}\n@article{cite-key, \n\tabstract = {my abs},\n\ttitle = {test {title}}\n@article{b}',
      ),
    ).toEqual(undefined);
  });
});
