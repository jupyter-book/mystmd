import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ISession } from './session/types.js';
import { loadExecutablePlugin } from './executablePlugin.js';

const mockSession = {
  log: {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  },
} as unknown as ISession;

describe('loadExecutablePlugin', () => {
  it('exposes vfile.path as MYST_VFILE_PATH for directives, roles, and transforms', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'myst-exec-plugin-'));
    const pluginPath = path.join(tmpDir, 'plugin.mjs');
    const script = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(JSON.stringify({
    name: 'test-plugin',
    directives: [{ name: 'testdir' }],
    roles: [{ name: 'testrole' }],
    transforms: [{ name: 'testtransform', stage: 'document' }],
  }));
  process.exit(0);
}
if (args[0] === '--directive' || args[0] === '--role') {
  console.log(JSON.stringify([{ type: 'text', value: process.env.MYST_VFILE_PATH ?? '' }]));
  process.exit(0);
}
if (args[0] === '--transform') {
  let input = '';
  process.stdin.on('data', (d) => { input += d; });
  process.stdin.on('end', () => {
    const tree = JSON.parse(input);
    tree.vfilePath = process.env.MYST_VFILE_PATH ?? '';
    console.log(JSON.stringify(tree));
  });
}
`;
    fs.writeFileSync(pluginPath, script, { mode: 0o755 });

    try {
      const plugin = await loadExecutablePlugin(mockSession, pluginPath);
      expect(plugin).toBeDefined();

      const fakeFile = { path: '/tmp/example/doc.md' } as any;
      const dirRes = plugin!.directives![0].run({ name: 'testdir' } as any, fakeFile, {} as any);
      expect(dirRes).toEqual([{ type: 'text', value: '/tmp/example/doc.md' }]);

      const roleRes = plugin!.roles![0].run({ name: 'testrole' } as any, fakeFile);
      expect(roleRes).toEqual([{ type: 'text', value: '/tmp/example/doc.md' }]);

      const tree: any = { type: 'root', children: [] };
      const transformPlugin = plugin!.transforms![0].plugin({} as any, {} as any);
      await transformPlugin(tree, fakeFile, () => {});
      expect(tree.vfilePath).toBe('/tmp/example/doc.md');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
