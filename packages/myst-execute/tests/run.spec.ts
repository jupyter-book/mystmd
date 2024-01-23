import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { kernelExecutionTransform, launchJupyterServer } from '../src';
import type { GenericParent } from 'myst-common';
import { VFile } from 'vfile';
import { KernelManager, ServerConnection, SessionManager } from '@jupyterlab/services';

type TestCase = {
  title: string;
  before: GenericParent;
  after: GenericParent;
  throws?: string; // RegExp pattern
};

type TestCases = {
  title: string;
  cases: TestCase[];
};

const only = '';

const casesList: TestCases[] = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith('.yml'))
  .map((file) => {
    const content = fs.readFileSync(path.join(__dirname, file), { encoding: 'utf-8' });
    return yaml.load(content) as TestCases;
  });

class SessionManagerFactory {
  _sessionManager: SessionManager | undefined;

  async load(): Promise<SessionManager> {
    if (this._sessionManager !== undefined) {
      return this._sessionManager;
    } else {
      const serverSettings = ServerConnection.makeSettings(
        await launchJupyterServer(__dirname, console),
      );
      const kernelManager = new KernelManager({ serverSettings });
      const sessionManager = new SessionManager({ kernelManager, serverSettings });
      this._sessionManager = sessionManager;
      return sessionManager;
    }
  }
}

const sessionManagerFactory = new SessionManagerFactory();

casesList.forEach(({ title, cases }) => {
  const filtered = cases.filter((c) => !only || c.title === only);
  if (filtered.length === 0) return;
  describe(title, () => {
    test.each(filtered.map((c): [string, TestCase] => [c.title, c]))(
      '%s',
      async (_, { before, after, throws }) => {
        const file = new VFile();
        file.path = path.join(__dirname, 'notebook.ipynb');

        await kernelExecutionTransform(before, file, {
          sessionFactory: async () => await sessionManagerFactory.load(),
          cachePath: path.join(__dirname, 'execute'),
          frontmatter: {
            kernelspec: {
              name: 'python3',
            },
          },
          ignoreCache: true,
          errorIsFatal: true,
        });
        if (throws !== null && throws !== undefined) {
          const fatalMessageReasons = file.messages
            .filter((msg) => msg.fatal)
            .map((msg) => msg.reason);
          expect(fatalMessageReasons).toEqual(
            expect.arrayContaining([expect.stringMatching(throws)]),
          );
        }
        expect(yaml.dump(before)).toEqual(yaml.dump(after));
      },
    );
  });
});
