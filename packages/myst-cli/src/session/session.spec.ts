import { describe, expect, it } from 'vitest';
import { Session } from '../session';
import { RuleId } from 'myst-common';
import { addWarningForFile } from '../utils/addWarningForFile';

describe('session warnings', () => {
  it('getAllWarnings returns for single session', async () => {
    const session = new Session();
    addWarningForFile(session, 'my-file', 'my message', 'error', { ruleId: RuleId.bibFileExists });
    expect(session.getAllWarnings(RuleId.bibFileExists)).toEqual([
      {
        file: 'my-file',
        message: 'my message',
        kind: 'error',
        ruleId: RuleId.bibFileExists,
      },
    ]);
  });
  it('getAllWarnings empty for different rule', async () => {
    const session = new Session();
    addWarningForFile(session, 'my-file', 'my message', 'error', {
      ruleId: RuleId.blockMetadataLoads,
    });
    expect(session.getAllWarnings(RuleId.bibFileExists)).toEqual([]);
  });
  it('getAllWarnings returns clone warnings', async () => {
    const session = new Session();
    const clone = await session.clone();
    addWarningForFile(session, 'my-file-0', 'my message', 'error', {
      ruleId: RuleId.bibFileExists,
    });
    addWarningForFile(clone, 'my-file-1', 'my message', 'error', { ruleId: RuleId.bibFileExists });
    expect(session.getAllWarnings(RuleId.bibFileExists)).toEqual([
      {
        file: 'my-file-0',
        message: 'my message',
        kind: 'error',
        ruleId: RuleId.bibFileExists,
      },
      {
        file: 'my-file-1',
        message: 'my message',
        kind: 'error',
        ruleId: RuleId.bibFileExists,
      },
    ]);
    expect(clone.getAllWarnings(RuleId.bibFileExists)).toEqual([
      {
        file: 'my-file-1',
        message: 'my message',
        kind: 'error',
        ruleId: RuleId.bibFileExists,
      },
    ]);
  });
  it('getAllWarnings deduplicates clone warnings', async () => {
    const session = new Session();
    const clone = await session.clone();
    addWarningForFile(session, 'my-file', 'my message', 'error', { ruleId: RuleId.bibFileExists });
    addWarningForFile(clone, 'my-file', 'my message', 'error', { ruleId: RuleId.bibFileExists });
    expect(session.getAllWarnings(RuleId.bibFileExists)).toEqual([
      {
        file: 'my-file',
        message: 'my message',
        kind: 'error',
        ruleId: RuleId.bibFileExists,
      },
    ]);
    expect(clone.getAllWarnings(RuleId.bibFileExists)).toEqual([
      {
        file: 'my-file',
        message: 'my message',
        kind: 'error',
        ruleId: RuleId.bibFileExists,
      },
    ]);
  });
});
