import { describe, expect, it } from 'vitest';
import { getConversionFns } from './images';

describe('getConversionFns', () => {
  it('unknown extension returns empty list', async () => {
    expect(getConversionFns('.bad', ['.png' as any])).toEqual([]);
  });
  it('known extension with no validExts returns empty list', async () => {
    expect(getConversionFns('.svg', [])).toEqual([]);
  });
  it('known extension with one validExt returns one item', async () => {
    expect(getConversionFns('.svg', ['.png' as any]).length).toEqual(1);
  });
  it('known extension with multiple validExts returns multiple items', async () => {
    expect(getConversionFns('.svg', ['.png', '.pdf', '.jpg'] as any[]).length).toEqual(2);
  });
  it('order of functions depends on order of validExts', async () => {
    expect(getConversionFns('.svg', ['.png', '.pdf'] as any[])).toEqual(
      getConversionFns('.svg', ['.pdf', '.png'] as any[]).reverse(),
    );
  });
});
