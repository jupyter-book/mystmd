import { beforeEach, describe, expect, it } from 'vitest';
import { ExportFormats } from 'myst-frontmatter';
import { exportSite, getExportFormats } from './build';
import { Session } from '../session';
import { config } from '../store/reducers';

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
        ExportFormats.typst,
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

describe('exportSite', () => {
  let session: Session;
  let sessionWithConfig: Session;

  beforeEach(() => {
    session = new Session();
    sessionWithConfig = new Session();
    const path = 'CURRENT_PATH';
    sessionWithConfig.store.dispatch(config.actions.receiveCurrentSitePath({ path }));
    sessionWithConfig.store.dispatch(config.actions.receiveSiteConfig({ path }));
  });
  it('no opts or config does not export site', async () => {
    expect(exportSite(session, {})).toBeFalsy();
  });
  it('opts.all exports site', async () => {
    expect(exportSite(session, { all: true })).toEqual(true);
  });
  it('opts.site exports site', async () => {
    expect(exportSite(session, { site: true, pdf: true })).toEqual(true);
  });
  it('opts.html exports site', async () => {
    expect(exportSite(session, { html: true, meca: false })).toEqual(true);
  });
  it('existing config exports site', async () => {
    expect(exportSite(sessionWithConfig, {})).toEqual(true);
  });
  it('force with existing config does not export site', async () => {
    expect(exportSite(sessionWithConfig, { force: true })).toBeFalsy();
  });
  it.each(['docx', 'pdf', 'tex', 'xml', 'md', 'meca'])(
    '%s with existing config does not export site',
    (opt) => {
      const opts: Record<string, boolean> = {};
      opts[opt] = true;
      expect(exportSite(sessionWithConfig, opts)).toBe(false);
    },
  );
});
