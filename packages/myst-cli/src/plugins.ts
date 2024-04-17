import fs from 'node:fs';
import type { ISession } from './session/types.js';
import { selectors } from './store/index.js';
import { RuleId, plural, type MystPlugin } from 'myst-common';
import { addWarningForFile } from './utils/addWarningForFile.js';

/**
 * Load user-defined plugin modules declared in the project frontmatter
 *
 * @param session session with logging
 */
export async function loadPlugins(session: ISession): Promise<MystPlugin> {
  let configPlugins: string[] = [];
  const state = session.store.getState();
  const projConfig = selectors.selectCurrentProjectConfig(state);
  if (projConfig?.plugins) configPlugins.push(...projConfig.plugins);
  const siteConfig = selectors.selectCurrentSiteConfig(state);
  if (siteConfig?.projects) {
    siteConfig.projects
      .filter((project): project is { path: string } => !!project.path)
      .forEach((project) => {
        const siteProjConfig = selectors.selectLocalProjectConfig(state, project.path);
        if (siteProjConfig?.plugins) configPlugins.push(...siteProjConfig.plugins);
      });
  }
  configPlugins = [...new Set(configPlugins)];
  const plugins: MystPlugin = {
    directives: [],
    roles: [],
    transforms: [],
  };
  if (configPlugins.length === 0) {
    return plugins;
  }
  session.log.debug(`Loading plugins: "${configPlugins.join('", "')}"`);
  const modules = await Promise.all(
    configPlugins.map(async (filename) => {
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
