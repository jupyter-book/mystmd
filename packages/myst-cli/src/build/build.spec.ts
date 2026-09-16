import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ExportFormats } from 'myst-frontmatter';
import { build, exportSite, getAllowedExportFormats, getRequestedExportFormats } from './build';
import { Session } from '../session';
import { config } from '../store/reducers';

describe('get export formats', () => {
  it('all build targets false in options no formats', async () => {
    expect(getAllowedExportFormats({ docx: false, pdf: false, tex: false, xml: false })).toEqual(
      [],
    );
    expect(getRequestedExportFormats({ docx: false, pdf: false, tex: false, xml: false })).toEqual(
      [],
    );
  });
  it('no build target in options returns all formats', async () => {
    expect(getAllowedExportFormats({})).toEqual([]);
    expect(getRequestedExportFormats({})).toEqual([]);
  });
  it('single build target true in options returns single format', async () => {
    expect(getAllowedExportFormats({ docx: true, pdf: false, tex: false, xml: false })).toEqual([
      ExportFormats.docx,
    ]);
    expect(getRequestedExportFormats({ docx: true, pdf: false, tex: false, xml: false })).toEqual([
      ExportFormats.docx,
    ]);
  });
  it('single build target true in options and all returns all formats', async () => {
    expect(
      getAllowedExportFormats({ all: true, docx: true, pdf: false, tex: false, xml: false }),
    ).toEqual([
      ExportFormats.docx,
      ExportFormats.pdf,
      ExportFormats.pdftex,
      ExportFormats.typst,
      ExportFormats.tex,
      ExportFormats.xml,
      ExportFormats.md,
      ExportFormats.meca,
      ExportFormats.cff,
    ]);
    expect(
      getRequestedExportFormats({ all: true, docx: true, pdf: false, tex: false, xml: false }),
    ).toEqual([ExportFormats.docx]);
  });
  it('all build targets true in options returns all formats', async () => {
    expect(getAllowedExportFormats({ docx: true, pdf: true, tex: true, xml: true })).toEqual([
      ExportFormats.docx,
      ExportFormats.pdf,
      ExportFormats.pdftex,
      ExportFormats.typst,
      ExportFormats.tex,
      ExportFormats.xml,
    ]);
    expect(getRequestedExportFormats({ docx: true, pdf: true, tex: true, xml: true })).toEqual([
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
  it.each(['docx', 'pdf', 'tex', 'xml', 'md', 'meca', 'cff'])(
    '%s with existing config does not export site',
    (opt) => {
      const opts: Record<string, boolean> = {};
      opts[opt] = true;
      expect(exportSite(sessionWithConfig, opts)).toBe(false);
    },
  );
});

describe('build without site configuration', () => {
  const originalCwd = process.cwd();
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'myst-no-config-'));
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it.each(['html', 'site', 'all'] as const)(
    'build --%s fails when no site configuration is found',
    async (opt) => {
      const session = new Session();
      await expect(build(session, [], { [opt]: true })).rejects.toThrow(
        /No configuration found/,
      );
    },
  );

  it.each(['docx', 'pdf', 'tex', 'typst', 'xml', 'md', 'meca', 'cff'] as const)(
    'build --%s fails when no configuration is found',
    async (opt) => {
      const session = new Session();
      await expect(build(session, [], { [opt]: true })).rejects.toThrow(
        /No configuration found/,
      );
    },
  );

  it('build with no flags fails when no configuration is found', async () => {
    const session = new Session();
    await expect(build(session, [], {})).rejects.toThrow(/No configuration found/);
  });
});
