import { noBuildTargets } from './build';

describe('noBuildTargets', () => {
  it('no build target in options returns true', async () => {
    expect(noBuildTargets({})).toBe(true);
  });
  it('all build targets false in options returns true', async () => {
    expect(noBuildTargets({ docx: false, pdf: false, tex: false, web: false })).toBe(true);
  });
  it('single build target true in options returns false', async () => {
    expect(noBuildTargets({ docx: true, pdf: false, tex: false, web: false })).toBe(false);
  });
  it('all build targets true in options returns false', async () => {
    expect(noBuildTargets({ docx: true, pdf: true, tex: true, web: true })).toBe(false);
  });
});
