import { describe, expect, test } from 'vitest';
import { VFile } from 'vfile';
import type { Link } from 'myst-spec-ext';
import { DOITransformer, isRecognizedDoi } from './doi';

describe('isRecognizedDoi', () => {
  test('doi.org URL', () => {
    expect(isRecognizedDoi('https://doi.org/10.1016/j.ultramic.2018.06.001')).toBe(true);
  });
  test('short doi.org URL', () => {
    expect(isRecognizedDoi('https://doi.org/cr3qwn')).toBe(true);
  });
  test('doi.org URL with special characters', () => {
    expect(
      isRecognizedDoi(
        'https://doi.org/10.1002/(SICI)1096-987X(199709)18:12%3C1450::AID-JCC3%3E3.0.CO;2-I',
      ),
    ).toBe(true);
  });
  test('raw DOI', () => {
    expect(isRecognizedDoi('10.1016/j.ultramic.2018.06.001')).toBe(true);
  });
  test('doi: prefix', () => {
    expect(isRecognizedDoi('doi:10.1016/j.ultramic.2018.06.001')).toBe(true);
  });
  test('invalid doi: prefix is not recognized', () => {
    expect(isRecognizedDoi('doi:invalid')).toBe(false);
  });
  test('publisher URL with embedded DOI', () => {
    expect(isRecognizedDoi('https://www.nature.com/articles/10.1038/s41586-020-2649-2')).toBe(
      false,
    );
  });
  test('publisher URL with embedded DOI when inferDoisFromUrls is enabled', () => {
    expect(
      isRecognizedDoi('https://www.nature.com/articles/10.1038/s41586-020-2649-2', {
        inferDoisFromUrls: true,
      }),
    ).toBe(true);
  });
});

describe('DOITransformer', () => {
  test('doi.org link', async () => {
    const file = new VFile();
    const t = new DOITransformer();
    const url = 'https://doi.org/10.1016/j.ultramic.2018.06.001';
    const link: Link = {
      type: 'link',
      url,
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.url).toBe(url);
    expect(link.data?.doi).toEqual('10.1016/j.ultramic.2018.06.001');
  });
  test('publisher URL with embedded DOI is not matched', () => {
    const t = new DOITransformer();
    const url = 'https://www.nature.com/articles/10.1038/s41586-020-2649-2';
    expect(t.test(url)).toBe(false);
  });
  test('publisher URL with embedded DOI is matched when enabled', () => {
    const t = new DOITransformer({ inferDoisFromUrls: true });
    const url = 'https://www.nature.com/articles/10.1038/s41586-020-2649-2';
    expect(t.test(url)).toBe(true);
  });
  test('invalid doi: link fails transform with error', () => {
    const file = new VFile();
    const t = new DOITransformer();
    const url = 'doi:invalid';
    const link: Link = { type: 'link', url, children: [] };
    expect(t.test(url)).toBe(true);
    expect(t.transform(link, file)).toBe(false);
    expect(file.messages.length).toBeGreaterThan(0);
  });
  test('short doi.org link transforms', () => {
    const file = new VFile();
    const t = new DOITransformer();
    const url = 'https://doi.org/cr3qwn';
    const link: Link = { type: 'link', url, children: [] };
    expect(t.test(url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.url).toBe(url);
    expect(link.data?.doi).toEqual('cr3qwn');
  });
  test('doi.org link with special characters transforms', () => {
    const file = new VFile();
    const t = new DOITransformer();
    const url =
      'https://doi.org/10.1002/(SICI)1096-987X(199709)18:12%3C1450::AID-JCC3%3E3.0.CO;2-I';
    const link: Link = { type: 'link', url, children: [] };
    expect(t.test(url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.data?.doi).toEqual(
      '10.1002/(SICI)1096-987X(199709)18:12%3C1450::AID-JCC3%3E3.0.CO;2-I',
    );
  });
});
