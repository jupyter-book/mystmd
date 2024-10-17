import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';
import { Session } from 'myst-cli';
import { clirun } from './clirun';

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
        Session,
        () => {
          return;
        },
        new Command(),
      )();
    } catch {
      expect(process.exit).toHaveBeenCalledWith(0);
    }
  });
  it('valid function passes -- keepAlive', async () => {
    await clirun(
      Session,
      () => {
        return;
      },
      new Command(),
      { keepAlive: true },
    )();
    expect(process.exit).not.toHaveBeenCalledWith(1);
  });
  it('error function exits', async () => {
    try {
      await clirun(
        Session,
        () => {
          throw new Error();
        },
        new Command(),
      )();
      expect(true).toBe(false);
    } catch {
      expect(process.exit).toHaveBeenCalledWith(1);
    }
  });
  // it('invalid node version exits', async () => {
  //   // jest.mock('./check');
  //   // const mockCheckNodeVersion = check.checkNodeVersion as jest.Mock;
  //   // mockCheckNodeVersion.mockImplementation(async () => {
  //   //   return false;
  //   // });

  //   // const mock = jest.mock('./check.ts', () => ({
  //   //   checkNodeVersion: jest.fn().mockImplementation(async () => {
  //   //     return false;
  //   //   }),
  //   // }));

  //   // const mockCheckNodeVersion = jest.spyOn(clirun, 'checkNodeVersion');
  //   // clirun.checkNodeVersion.mockImplementation(async () => {
  //   //   return false;
  //   // });
  //   //   .mockImplementation(async () => {
  //   //     return false;
  //   //   });

  //   // mockCheckNodeVersion.mockImplementation(async () => {
  //   //   return false;
  //   // });
  //   try {
  //     await clirun(() => {
  //       return;
  //     }, new Command())();
  //     expect(true).toBe(false);
  //   } catch (error) {
  //     console.log(error);
  //     expect(process.exit).toHaveBeenCalledWith(1);
  //   }
  //   // jest.unmock('./check.js');
  //   // mockCheckNodeVersion.mockRestore();
  // });
});
