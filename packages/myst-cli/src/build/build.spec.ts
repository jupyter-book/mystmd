import { ExportFormats } from 'myst-frontmatter';
import { getExportFormats } from './build';

describe('getExportFormats', () => {
  it('no build target in options returns all formats', async () => {
    expect(getExportFormats({})).toEqual([
      ExportFormats.docx,
      ExportFormats.pdf,
      ExportFormats.tex,
    ]);
  });
  it('all build targets false in options returns all formats', async () => {
    expect(getExportFormats({ docx: false, pdf: false, tex: false })).toEqual([
      ExportFormats.docx,
      ExportFormats.pdf,
      ExportFormats.tex,
    ]);
  });
  it('single build target true in options returns single format', async () => {
    expect(getExportFormats({ docx: true, pdf: false, tex: false })).toEqual([ExportFormats.docx]);
  });
  it('all build targets true in options returns all formats', async () => {
    expect(getExportFormats({ docx: true, pdf: true, tex: true })).toEqual([
      ExportFormats.docx,
      ExportFormats.pdf,
      ExportFormats.tex,
    ]);
  });
});
