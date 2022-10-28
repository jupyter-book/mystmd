import { ExportFormats } from 'myst-frontmatter';
import { getExportFormats } from './build';

describe('getExportFormats', () => {
  it('no build target in options and force returns no formats', async () => {
    expect(getExportFormats({ force: true })).toEqual([]);
  });
  it('all build targets false in options and force returns no formats', async () => {
    expect(getExportFormats({ force: true, docx: false, pdf: false, tex: false })).toEqual([]);
  });
  it('no build target in options returns all formats', async () => {
    expect(getExportFormats({})).toEqual([
      ExportFormats.docx,
      ExportFormats.pdf,
      ExportFormats.tex,
    ]);
  });
  it('all build targets false in options returns all formats', async () => {
    expect(getExportFormats({ force: false, docx: false, pdf: false, tex: false })).toEqual([
      ExportFormats.docx,
      ExportFormats.pdf,
      ExportFormats.tex,
    ]);
  });
  it('single build target true in options returns single format', async () => {
    expect(getExportFormats({ docx: true, pdf: false, tex: false })).toEqual([ExportFormats.docx]);
  });
  it('single build target true in options and force returns single format', async () => {
    expect(getExportFormats({ force: true, docx: true, pdf: false, tex: false })).toEqual([
      ExportFormats.docx,
    ]);
  });
  it('all build targets true in options returns all formats', async () => {
    expect(getExportFormats({ docx: true, pdf: true, tex: true })).toEqual([
      ExportFormats.docx,
      ExportFormats.pdf,
      ExportFormats.tex,
    ]);
  });
  it('all build targets true in options and force returns all formats', async () => {
    expect(getExportFormats({ force: true, docx: true, pdf: true, tex: true })).toEqual([
      ExportFormats.docx,
      ExportFormats.pdf,
      ExportFormats.tex,
    ]);
  });
});
