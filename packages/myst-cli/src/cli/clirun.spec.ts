import { Command } from 'commander';
import { Session } from '../session';
import { clirun } from './clirun';

let mockExit: jest.SpyInstance;

describe('clirun', () => {
  beforeEach(() => {
    mockExit = jest.spyOn(process, 'exit');
    mockExit.mockImplementation(() => {
      throw new Error();
    });
  });
  afterEach(() => {
    mockExit.mockRestore();
  });
  it('valid function passes', async () => {
    await clirun(
      Session,
      () => {
        return;
      },
      new Command(),
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
  //   //   console.log('hi');
  //   //   return false;
  //   // });

  //   // const mock = jest.mock('./check.ts', () => ({
  //   //   checkNodeVersion: jest.fn().mockImplementation(async () => {
  //   //     console.log('hi');
  //   //     return false;
  //   //   }),
  //   // }));

  //   // const mockCheckNodeVersion = jest.spyOn(clirun, 'checkNodeVersion');
  //   // clirun.checkNodeVersion.mockImplementation(async () => {
  //   //   return false;
  //   // });
  //   //   .mockImplementation(async () => {
  //   //     console.log('lkdjslkfjdlskjdlksjf');
  //   //     return false;
  //   //   });

  //   // mockCheckNodeVersion.mockImplementation(async () => {
  //   //   console.log('lkdjslkfjdlskjdlksjf');
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
