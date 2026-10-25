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

  it('keeps the remote URL when the content is not an image or video', async () => {
    vi.mocked(fetchRemoteAsset).mockResolvedValue({ name: 'abc.html', contentType: 'text/html' });
    const result = await saveImageInStaticFolder(
      session,
      'https://example.com/page',
      'index.md',
      writeFolder,
    );
    expect(result).toBeNull();
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
