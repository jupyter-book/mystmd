import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Session } from '../../session';
import * as collectModule from '../utils/collectExportOptions.js';
import * as fileModule from '../../process/file.js';
import { resolvePageDownloads } from './manifest';

const session = new Session();

beforeEach(() => vi.restoreAllMocks());

describe('resolvePageDownloads', () => {
  it('does not collect export options for a page without downloads', async () => {
    vi.spyOn(fileModule, 'getRawFrontmatterFromFile').mockResolvedValue({ title: 'Page' });
    const collect = vi.spyOn(collectModule, 'collectExportOptions').mockResolvedValue([]);
    expect(await resolvePageDownloads(session, 'page.md')).toBeUndefined();
    expect(collect).not.toHaveBeenCalled();
  });
  it('collects export options for a page with downloads', async () => {
    vi.spyOn(fileModule, 'getRawFrontmatterFromFile').mockResolvedValue({
      downloads: [{ id: 'missing-export' }],
    });
    const collect = vi.spyOn(collectModule, 'collectExportOptions').mockResolvedValue([]);
    expect(await resolvePageDownloads(session, 'page.md')).toEqual([]);
    expect(collect).toHaveBeenCalledOnce();
  });
});
