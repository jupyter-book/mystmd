import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';
import { clirun } from './utils.js';
import { Session } from './session.js';

let mockExit: any;

describe('clirun', () => {
  beforeEach(() => {
    mockExit = vi.spyOn(process, 'exit');
    mockExit.mockImplementation(() => {
      throw new Error();
    });
  });
  afterEach(() => {
    mockExit.mockRestore();
  });
  it('valid function passes', async () => {
    try {
      await clirun(
        () => {
          return;
        },
        { getSession: () => new Session(), program: new Command() },
      )();
    } catch {
      expect(process.exit).toHaveBeenCalledWith(0);
    }
  });
  it('valid function passes -- keepAlive', async () => {
    await clirun(
      () => {
        return;
      },
      { getSession: () => new Session(), program: new Command() },
      { keepAlive: true },
    )();
    expect(process.exit).not.toHaveBeenCalledWith(1);
  });
  it('error function exits', async () => {
    try {
      await clirun(
        () => {
          throw new Error();
        },

        { getSession: () => new Session(), program: new Command() },
      )();
      expect(true).toBe(false);
    } catch {
      expect(process.exit).toHaveBeenCalledWith(1);
    }
  });
});
