import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import yaml from 'js-yaml';
import which from 'which';
import type { ICache } from '../src';
import { kernelExecutionTransform, launchJupyterServer } from '../src';
import type { ExecutionResult } from '../src/types.js';
import type { GenericParent } from 'myst-common';
import { VFile } from 'vfile';
import { KernelManager, ServerConnection, SessionManager } from '@jupyterlab/services';
import { default as nodeFetch, Headers, Request, Response } from 'node-fetch';

// fetch polyfill for node<18
if (!globalThis.fetch) {
  globalThis.fetch = nodeFetch as any;
  globalThis.Headers = Headers as any;
  globalThis.Request = Request as any;
  globalThis.Response = Response as any;
}

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

const pythonPath = which.sync('python', { nothrow: true });
if (pythonPath === null) {
  throw new Error('python not found in PATH; install it to run myst-execute tests');
}
if (spawnSync(pythonPath, ['-c', 'import jupyter_server']).status !== 0) {
  throw new Error('jupyter_server not found; run `pip install jupyter-server` to run myst-execute tests');
}

const only = '';

const casesList: TestCases[] = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith('.yml'))
  .map((file) => {
    const content = fs.readFileSync(path.join(__dirname, file), { encoding: 'utf-8' });
    return yaml.load(content) as TestCases;
  });

// Don't store or retrieve anything from cache
const noOpCache: ICache<ExecutionResult[]> = {
  test: (key: string) => false,
  get: (key: string) => undefined,
  set: (key: string, value: any) => {},
};

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
    test.each(filtered.map((c, index): [string, TestCase, number] => [c.title, c, index]))(
      '%s',
      async (_, { before, after, throws }, index) => {
        const file = new VFile();
        file.path = path.join(__dirname, `notebook-${index}.ipynb`);

        await kernelExecutionTransform(before, file, {
          basePath: __dirname,
          sessionFactory: async () => await sessionManagerFactory.load(),
          cache: noOpCache,
          frontmatter: {
            kernelspec: {
              name: 'python3',
            },
          },
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
        expect(before).toMatchObject(after);
      },
      30_000,
    );
  });
});
