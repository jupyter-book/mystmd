import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { RuleId, plural } from 'myst-common';
import type { PluginInfo } from 'myst-config';
import type { ISession } from '../session/index.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { loadExecutablePlugin } from './executable.js';
import type { MystPlugin, ValidatedMystPlugin } from './types.js';

/**
 * Load user-defined plugin modules declared in the project frontmatter
 *
 * @param session session with logging
 */
export async function loadPlugins(
  session: ISession,
  plugins: PluginInfo[],
): Promise<ValidatedMystPlugin> {
  const loadedPlugins: ValidatedMystPlugin = session.plugins ?? {
    directives: [],
    roles: [],
    transforms: [],
    paths: [],
  };

  // Deduplicate by path...
  const newPlugins = [...new Map(plugins.map((info) => [info.path, info])).values()].filter(
    // ...and filter out already loaded plugins
    ({ path }) => !loadedPlugins.paths.includes(path),
  );
  if (newPlugins.length === 0) {
    return loadedPlugins;
  }
  session.log.debug(
    `Loading plugins: "${newPlugins.map((info) => `${info.path} (${info.type})`).join('", "')}"`,
  );
  const modules = await Promise.all(
    newPlugins.map(async (info) => {
      const { type, path } = info;
      switch (type) {
        case 'executable': {
          // Ensure the plugin is a file
          if (!fs.statSync(path, { throwIfNoEntry: false })?.isFile()) {
            addWarningForFile(
              session,
              path,
              `Unknown plugin "${path}", it must be an executable file`,
              'error',
              {
                ruleId: RuleId.pluginLoads,
              },
            );
            return null;
          }
          // Ensure the plugin is executable
          try {
            fs.accessSync(path, fs.constants.X_OK);
          } catch (err) {
            addWarningForFile(session, path, `Plugin "${path}" is not executable`, 'error', {
              ruleId: RuleId.pluginLoads,
            });
            return null;
          }
          const plugin = await loadExecutablePlugin(session, info.path);
          if (plugin === undefined) {
            addWarningForFile(
              session,
              path,
              `Non-zero exit code after querying executable "${path}" for plugin specification`,
              'error',
              {
                ruleId: RuleId.pluginLoads,
              },
            );

            return null;
          }
          return { path, module: { plugin } };
        }
        case 'javascript': {
          if (!fs.statSync(path, { throwIfNoEntry: false })?.isFile() || !path.endsWith('.mjs')) {
            addWarningForFile(
              session,
              path,
              `Unknown plugin "${path}", it must be an mjs file`,
              'error',
              {
                ruleId: RuleId.pluginLoads,
              },
            );
            return null;
          }
          let module: any;
          const pathURL = pathToFileURL(path);
          try {
            module = await import(pathURL.toString());
          } catch (error) {
            session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
            addWarningForFile(session, path, `Error reading plugin: ${error}`, 'error', {
              ruleId: RuleId.pluginLoads,
            });
            return null;
          }
          return { path, module };
        }
      }
    }),
  );
  modules.forEach((pluginLoader) => {
    if (!pluginLoader) return;
    const plugin: MystPlugin = pluginLoader.module.default || pluginLoader.module.plugin;
    const directives = plugin.directives || pluginLoader.module.directives;
    const roles = plugin.roles || pluginLoader.module.roles;
    const transforms = plugin.transforms || pluginLoader.module.transforms;
    session.log.info(
      `🔌 ${plugin?.name ?? 'Unnamed Plugin'} (${pluginLoader.path}) loaded: ${plural(
        '%s directive(s)',
        directives,
      )}, ${plural('%s role(s)', roles)}, ${plural('%s transform(s)', transforms)}`,
    );
    if (directives) {
      // TODO: validate each directive
      loadedPlugins.directives.push(...directives);
    }
    if (roles) {
      // TODO: validate each role
      loadedPlugins.roles.push(...roles);
    }
    if (transforms) {
      // TODO: validate each transform
      loadedPlugins.transforms.push(...transforms);
    }
    loadedPlugins.paths.push(pluginLoader.path);
  });
  session.plugins = loadedPlugins;
  session.log.debug('Plugins loaded');
  return loadedPlugins;
}
