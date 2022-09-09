import { Inventory } from './intersphinx';

describe('Test Inventory', () => {
  test('Load python inventory', async () => {
    const inv = new Inventory({ path: 'https://docs.python.org/3.7' });
    await inv.load();
    expect(inv._loaded).toBe(true);
    expect(inv.numEntries).toBeGreaterThan(10000);
    const entry = inv.getEntry({ name: 'library/abc' });
    expect(entry?.display?.includes('Abstract')).toBe(true);
    expect(entry?.location?.includes('abc.html')).toBe(true);
    expect(entry?.type).toBe('std:doc');
  });
});
