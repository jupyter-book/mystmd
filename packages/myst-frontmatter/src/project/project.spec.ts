import { describe, expect, it } from 'vitest';
import type { ValidationOptions } from 'simple-validators';
import { validateProjectFrontmatter } from './validators';

function opts(): ValidationOptions {
  return { property: 'test', messages: {} };
}

describe('abbreviations firstTimeLong', () => {
  it('accepts firstTimeLong boolean alongside abbreviation definitions', () => {
    const result = validateProjectFrontmatter(
      {
        abbreviations: {
          firstTimeLong: true,
          TLA: 'Three Letter Acronym',
        },
      },
      opts(),
    );
    expect(result.abbreviations).toEqual({
      firstTimeLong: true,
      TLA: 'Three Letter Acronym',
    });
  });

  it('preserves firstTimeLong false', () => {
    const result = validateProjectFrontmatter(
      {
        abbreviations: {
          firstTimeLong: false,
          TLA: 'Three Letter Acronym',
        },
      },
      opts(),
    );
    expect(result.abbreviations).toEqual({
      firstTimeLong: false,
      TLA: 'Three Letter Acronym',
    });
  });

  it('coerces firstTimeLong string true', () => {
    const result = validateProjectFrontmatter(
      {
        abbreviations: {
          firstTimeLong: 'true',
        },
      },
      opts(),
    );
    expect(result.abbreviations).toEqual({
      firstTimeLong: true,
    });
  });

  it('errors on invalid firstTimeLong values', () => {
    const options = opts();
    const result = validateProjectFrontmatter(
      {
        abbreviations: {
          firstTimeLong: 42,
          TLA: 'Three Letter Acronym',
        },
      },
      options,
    );
    expect(result.abbreviations).toEqual({
      TLA: 'Three Letter Acronym',
    });
    expect(options.messages.errors?.length).toEqual(1);
  });
});
