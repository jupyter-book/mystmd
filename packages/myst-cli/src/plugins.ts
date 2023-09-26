import fs from 'node:fs';
import type { ISession } from './session/types.js';
import { selectCurrentProjectConfig } from './store/selectors.js';
import { RuleId, type MystPlugin } from 'myst-common';
import { addWarningForFile } from './utils/addWarningForFile.js';

export async function loadPlugins(session: ISession): Promise<MystPlugin> {
  const config = selectCurrentProjectConfig(session.store.getState());

  const plugins: MystPlugin = {
    directives: [],
    roles: [],
  };
  if (!config?.plugins || config.plugins.length === 0) {
    return plugins;
  }
  session.log.debug(`Loading plugins: "${config?.plugins?.join('", "')}"`);
  const modules = await Promise.all(
    config?.plugins?.map(async (filename) => {
      if (!fs.statSync(filename).isFile || !filename.endsWith('.mjs')) {
        addWarningForFile(
          session,
          filename,
          `Unknown plugin "${filename}", it must be an mjs file`,
          'error',
          {
            ruleId: RuleId.pluginLoads,
          },
        );
        return null;
      }
      let module: any;
      try {
        module = await import(filename);
      } catch (error) {
        session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
        addWarningForFile(session, filename, `Error reading plugin: ${error}`, 'error', {
          ruleId: RuleId.pluginLoads,
        });
        return null;
      }
      return { filename, module };
    }),
  );
  modules.forEach((plugin) => {
    if (!plugin) return;
    const pluginConfig = plugin.module.plugin;
    session.log.info(
      `🔌 ${pluginConfig?.name ?? 'Unnamed Plugin'} (${plugin.filename}) loaded: ${
        plugin.module.directives?.length ?? 0
      } directive(s), ${plugin.module.roles?.length ?? 0} role(s)`,
    );
    if (plugin.module.directives) {
      // TODO: validate each directive
      plugins.directives.push(...plugin.module.directives);
    }
    if (plugin.module.roles) {
      // TODO: validate each role
      plugins.roles.push(...plugin.module.roles);
    }
  });
  session.log.debug('Plugins loaded');
  return plugins;
}
