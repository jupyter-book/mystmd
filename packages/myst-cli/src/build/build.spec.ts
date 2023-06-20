import { describe, expect, it } from 'vitest';
import { ExportFormats } from 'myst-frontmatter';
import { getExportFormats } from './build';

describe('getExportFormats', () => {
  it('no build target in options and force returns no formats', async () => {
    expect(getExportFormats({ force: true })).toEqual([]);
  });
  it('all build targets false in options and force returns no formats', async () => {
    expect(
      getExportFormats({ force: true, docx: false, pdf: false, tex: false, xml: false }),
    ).toEqual([]);
  });
  it('no build target in options returns all formats', async () => {
    expect(getExportFormats({})).toEqual([]);
  });
  it('all build targets false in options returns no formats', async () => {
    expect(
      getExportFormats({ force: false, docx: false, pdf: false, tex: false, xml: false }),
    ).toEqual([]);
  });
  it('single build target true in options returns single format', async () => {
    expect(getExportFormats({ docx: true, pdf: false, tex: false, xml: false })).toEqual([
      ExportFormats.docx,
    ]);
  });
  it('single build target true in options and force returns single format', async () => {
    expect(
      getExportFormats({ force: true, docx: true, pdf: false, tex: false, xml: false }),
    ).toEqual([ExportFormats.docx]);
  });
  it('single build target true in options and all returns all formats', async () => {
    expect(getExportFormats({ all: true, docx: true, pdf: false, tex: false, xml: false })).toEqual(
      [
        ExportFormats.docx,
        ExportFormats.pdf,
        ExportFormats.tex,
        ExportFormats.xml,
        ExportFormats.md,
        ExportFormats.meca,
      ],
    );
  });
  it('all build targets true in options returns all formats', async () => {
    expect(getExportFormats({ docx: true, pdf: true, tex: true, xml: true })).toEqual([
      ExportFormats.docx,
      ExportFormats.pdf,
      ExportFormats.tex,
      ExportFormats.xml,
    ]);
  });
  it('all build targets true in options and force returns all formats', async () => {
    expect(getExportFormats({ force: true, docx: true, pdf: true, tex: true, xml: true })).toEqual([
      ExportFormats.docx,
      ExportFormats.pdf,
      ExportFormats.tex,
      ExportFormats.xml,
    ]);
  });
});
