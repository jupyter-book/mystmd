import { describe, expect, it } from 'vitest';
import { fillNumbering } from './validators';

describe('fillNumbering', () => {
  it('empty numberings return empty', async () => {
    expect(fillNumbering({}, {})).toEqual({});
  });
  it('boolean base is kept', async () => {
    expect(fillNumbering(true as any, {})).toEqual({ all: { enabled: true } });
  });
  it('boolean filler is kept', async () => {
    expect(fillNumbering({}, true as any)).toEqual({ all: { enabled: true } });
  });
  it('boolean false is kept', async () => {
    expect(fillNumbering(false as any, {})).toEqual({ all: { enabled: false } });
  });
  it('string boolean shorthand is coerced', async () => {
    // isBoolean accepts 'true'/'false', so the shorthand must be coerced rather
    // than passed through - the string 'false' is truthy.
    expect(fillNumbering('false' as any, {})).toEqual({ all: { enabled: false } });
    expect(fillNumbering('true' as any, {})).toEqual({ all: { enabled: true } });
  });
  it('base numberings return base', async () => {
    expect(
      fillNumbering(
        {
          all: { enabled: true },
          enumerator: { template: '' },
          heading_6: { enabled: false },
        },
        {},
      ),
    ).toEqual({
      all: { enabled: true },
      enumerator: { template: '' },
      heading_6: { enabled: false },
    });
  });
  it('filler numberings return filler', async () => {
    expect(
      fillNumbering(
        {},
        {
          all: { enabled: true },
          enumerator: { template: '' },
          heading_6: { enabled: false },
        },
      ),
    ).toEqual({
      all: { enabled: true },
      enumerator: { template: '' },
      heading_6: { enabled: false },
    });
  });
  it('basic keys fill', async () => {
    expect(
      fillNumbering(
        {
          heading_1: { enabled: true, start: 2 },
          list: { enabled: true },
        },
        {
          enumerator: { template: '' },
          figure: { enabled: true, template: 'Fig. %s' },
          another: { enabled: true },
        },
      ),
    ).toEqual({
      enumerator: { template: '' },
      heading_1: { enabled: true, start: 2 },
      list: { enabled: true },
      figure: { enabled: true, template: 'Fig. %s' },
      another: { enabled: true },
    });
  });
  it('sub-keys fill', async () => {
    expect(
      fillNumbering(
        {
          heading_1: { enabled: true, start: 2 },
        },
        {
          heading_1: { template: 'Fig. %s' },
        },
      ),
    ).toEqual({
      heading_1: { enabled: true, start: 2, template: 'Fig. %s' },
    });
  });
  it('all overrides previous enabled values', async () => {
    expect(
      fillNumbering(
        {
          all: { enabled: false },
          heading_1: { enabled: true, start: 2 },
          list: { enabled: false },
          heading_3: { enabled: true },
        },
        {
          heading_2: { enabled: true, template: 'Fig. %s' },
          heading_3: { enabled: true },
        },
      ),
    ).toEqual({
      all: { enabled: false },
      heading_1: { enabled: true, start: 2 },
      list: { enabled: false },
      heading_2: { enabled: false, template: 'Fig. %s' },
      heading_3: { enabled: true },
    });
    expect(
      fillNumbering(
        {
          all: { enabled: true },
          heading_1: { enabled: true, start: 2 },
          list: { enabled: false },
          heading_3: { enabled: false },
        },
        {
          heading_2: { enabled: false, template: 'Fig. %s' },
          heading_3: { enabled: true },
        },
      ),
    ).toEqual({
      all: { enabled: true },
      heading_1: { enabled: true, start: 2 },
      list: { enabled: false },
      heading_2: { enabled: true, template: 'Fig. %s' },
      heading_3: { enabled: false },
    });
  });
});
