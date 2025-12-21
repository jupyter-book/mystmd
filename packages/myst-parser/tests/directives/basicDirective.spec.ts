import { describe, expect, test } from 'vitest';
import { RuleId } from 'myst-common';
import { mystParse } from '../../src';
import { VFile } from 'vfile';

describe('basic directive tests', () => {
  test('Errors not raised for directives that are not processed', () => {
    const vfile1 = new VFile();
    mystParse('````{code}\n```{dontraiseerror}\n```\n````', { vfile: vfile1 }) as any;
    expect(vfile1.messages).toEqual([]);
    const vfile2 = new VFile();
    mystParse('```{raiseerror}\nblah\n```', { vfile: vfile2 }) as any;
    expect(vfile2.messages).toMatchObject([
      {
        message: 'unknown directive: raiseerror',
        ruleId: RuleId.directiveKnown,
      },
    ]);
  });
});
