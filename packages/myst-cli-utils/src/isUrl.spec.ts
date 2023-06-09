import { describe, expect, it } from 'vitest';
import { isUrl } from './isUrl';

describe('isUrl', () => {
  it('matches urls', async () => {
    expect(isUrl('https://curvenote.com')).toEqual(true);
  });
  it('does no match partial urls', async () => {
    expect(isUrl('curvenote.com')).toEqual(false);
  });
});
