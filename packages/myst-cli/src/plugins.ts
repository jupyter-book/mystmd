import fs from 'node:fs';
import type { ISession } from './session/types.js';
import { selectCurrentProjectConfig } from './store/selectors.js';
import { RuleId, type MystPlugin } from 'myst-common';
import { plural } from 'myst-cli-utils';
import { addWarningForFile } from './utils/addWarningForFile.js';

export async function loadPlugins(session: ISession): Promise<MystPlugin> {
  const config = selectCurrentProjectConfig(session.store.getState());

  const plugins: MystPlugin = {
    directives: [],
    roles: [],
    transforms: [],
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
  modules.forEach((pluginLoader) => {
    if (!pluginLoader) return;
    const plugin: MystPlugin = pluginLoader.module.default || pluginLoader.module.plugin;
    const directives = plugin.directives || pluginLoader.module.directives;
    const roles = plugin.roles || pluginLoader.module.roles;
    const transforms = plugin.transforms || pluginLoader.module.transforms;
    session.log.info(
      `🔌 ${plugin?.name ?? 'Unnamed Plugin'} (${pluginLoader.filename}) loaded: ${plural(
        '%s directive(s)',
        directives,
      )}, ${plural('%s role(s)', roles)}, ${plural('%s transform(s)', transforms)}`,
    );
    if (directives) {
      // TODO: validate each directive
      plugins.directives.push(...directives);
    }
    if (roles) {
      // TODO: validate each role
      plugins.roles.push(...roles);
    }
    if (transforms) {
      // TODO: validate each transform
      plugins.transforms.push(...transforms);
    }
  });
  session.log.debug('Plugins loaded');
  return plugins;
}
