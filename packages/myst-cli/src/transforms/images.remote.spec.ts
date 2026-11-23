import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ISession } from '../session/types.js';
import { fetchRemoteAsset } from '../utils/fetchRemoteAsset.js';
import { saveImageInStaticFolder } from './images';

vi.mock('../utils/fetchRemoteAsset.js', () => ({ fetchRemoteAsset: vi.fn() }));
vi.mock('../utils/addWarningForFile.js', () => ({ addWarningForFile: vi.fn() }));

const session = {
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  sourcePath: () => process.cwd(),
} as unknown as ISession;

describe('saveImageInStaticFolder with remote URLs', () => {
  let writeFolder: string;

  beforeEach(() => {
    writeFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'myst-images-'));
  });

  afterEach(() => {
    fs.rmSync(writeFolder, { recursive: true, force: true });
    vi.mocked(fetchRemoteAsset).mockReset();
  });

  it('saves a remote video', async () => {
    vi.mocked(fetchRemoteAsset).mockResolvedValue({ name: 'abc.mp4', contentType: 'video/mp4' });
    const result = await saveImageInStaticFolder(
      session,
      'https://example.com/movie.mp4',
      'index.md',
      writeFolder,
    );
    expect(result).toEqual({
      urlSource: 'https://example.com/movie.mp4',
      url: path.join(writeFolder, 'abc.mp4'),
    });
  });

  it.each([
    ['text/html', 'html'],
    ['video/quicktime', 'qt'],
  ])('keeps the remote URL when the content is %s', async (contentType, ext) => {
    // Like the real fetchRemoteAsset, write the response to disk before returning
    vi.mocked(fetchRemoteAsset).mockImplementation(async (_s, _u, folder, stem) => {
      fs.writeFileSync(path.join(folder, `${stem}.${ext}`), 'data');
      return { name: `${stem}.${ext}`, contentType };
    });
    const result = await saveImageInStaticFolder(
      session,
      'https://example.com/page',
      'index.md',
      writeFolder,
    );
    expect(result).toBeNull();
    // Nothing is left behind for the next build to pick up as a cached image
    expect(fs.readdirSync(writeFolder)).toEqual([]);
  });

  it('keeps the remote URL when the download fails', async () => {
    vi.mocked(fetchRemoteAsset).mockRejectedValue(new Error('network down'));
    const result = await saveImageInStaticFolder(
      session,
      'https://example.com/image.png',
      'index.md',
      writeFolder,
      { altOutputFolder: '/' },
    );
    expect(result).toBeNull();
  });
});
