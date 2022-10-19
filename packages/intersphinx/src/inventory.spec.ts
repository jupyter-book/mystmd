import { Inventory } from './intersphinx';

describe('Test Inventory', () => {
  test('Path manipulation - custom inv file', () => {
    const inv = new Inventory({ path: 'https://docs.python.org/3.7/something.inv' });
    expect(inv.path).toBe('https://docs.python.org/3.7');
    expect(inv.invName).toBe('something.inv');
  });
  test('Path manipulation - trailing slashes', () => {
    const inv = new Inventory({ path: 'https://docs.python.org/3.7/' });
    expect(inv.path).toBe('https://docs.python.org/3.7');
    expect(inv.invName).toBe('objects.inv');
  });
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
