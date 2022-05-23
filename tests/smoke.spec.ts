import { exec as execWithCb } from 'child_process';
import util from 'util';

const exec = util.promisify(execWithCb);

describe('CLI Smoke Tests', () => {
  test('an example site', async () => {
    try {
      const { stdout } = await exec('curvenote web build -o', { cwd: 'tests/example' });
      console.log(stdout);
    } catch (error) {
      expect(error).toBeNull();
    }
  });
});
