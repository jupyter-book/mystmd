import { describe, expect, it, vi, beforeEach } from 'vitest';
import memfs from 'memfs';
import { configFromPath } from './config';
import { Session } from './session';

vi.mock('fs', () => ({ ['default']: memfs.fs }));

beforeEach(() => memfs.vol.reset());

const session = new Session();

describe('configFromPath', () => {
  it('finds myst.yml', () => {
    memfs.vol.fromJSON({ '/proj/myst.yml': 'version: 1' });
    expect(configFromPath(session, '/proj')).toBe('/proj/myst.yml');
  });
  it('finds myst.yaml', () => {
    memfs.vol.fromJSON({ '/proj/myst.yaml': 'version: 1' });
    expect(configFromPath(session, '/proj')).toBe('/proj/myst.yaml');
  });
  it('returns undefined when no config exists', () => {
    memfs.vol.fromJSON({ '/proj/readme.md': '' });
    expect(configFromPath(session, '/proj')).toBeUndefined();
  });
  it('throws when both myst.yml and myst.yaml exist', () => {
    memfs.vol.fromJSON({ '/proj/myst.yml': 'version: 1', '/proj/myst.yaml': 'version: 1' });
    expect(() => configFromPath(session, '/proj')).toThrow('Multiple config files');
  });
});
