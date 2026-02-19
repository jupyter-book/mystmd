import fs from 'node:fs';
import type { GenericParent } from 'myst-common';
import { RuleId } from 'myst-common';
import { computeHash, hashAndCopyStaticFile, isUrl } from 'myst-cli-utils';
import { selectAll } from 'unist-util-select';
import path from 'node:path';
import type { ISession } from '../session/types.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { fetchRemoteAsset } from '../utils/fetchRemoteAsset.js';
import { getSourceFolder } from './links.js';
import { resolveOutputPath } from './images.js';
import type { AnyWidget } from 'myst-spec-ext';

export async function transformWidgetStaticAssetsToDisk(
  session: ISession,
  tree: GenericParent,
  sourceFile: string,
  writeFolder: string,
  altWriteFolder: string,
) {
  for (const widgetNode of selectAll('anywidget', tree) as (AnyWidget & GenericParent)[]) {
    for (const [attr, ext] of [
      ['esm', 'mjs'],
      ['css', 'css'],
    ]) {
      const attrPath = (widgetNode as Record<string, unknown>)[attr] as string | undefined;
      if (attrPath === undefined) {
        continue;
      }
      const attrSourceFolder = getSourceFolder(attrPath, sourceFile, session.sourcePath());
      console.log(attrSourceFolder, attrPath, '1');
      const attrLocalPath = path.join(attrSourceFolder, attrPath);
      let fileName: string | undefined;
      if (isUrl(attrPath)) {
        const stem = computeHash(attrPath);

        const exists = fs.existsSync(writeFolder);
        // Check whether file with stem exists (but unknown extension)
        const existingName = fs.readdirSync(writeFolder).find((f) => path.parse(f).name === stem);
        if (exists && existingName !== undefined) {
          session.log.debug(`Cached asset found for '${attr}' (${attrPath})...`);
          fileName = existingName;
        } else {
          session.log.debug(
            `Fetching asset for '${attr}' (${attrPath})...\n  -> saving to: ${fileName}`,
          );
          try {
            const { name } = await fetchRemoteAsset(session, attrPath, writeFolder, stem, {
              extension: ext,
            });
            fileName = name;
          } catch (error) {
            session.log.debug(`\n\n${(error as Error).stack}\n\n`);
            addWarningForFile(
              session,
              fileName,
              `Error saving asset for '${attr}' "${attrPath}": ${(error as Error).message}`,
              'error',
              // TODO: add "asset downloads" rule?
            );
            continue;
          }
        }
      } else if (fs.existsSync(attrLocalPath)) {
        // Non-oxa, non-url local image paths relative to the config.section.path
        if (path.resolve(path.dirname(attrLocalPath)) === path.resolve(writeFolder)) {
          // If file is already in write folder, don't hash/copy
          fileName = path.basename(attrLocalPath);
        } else {
          fileName = hashAndCopyStaticFile(session, attrLocalPath, writeFolder, (m: string) => {
            addWarningForFile(session, sourceFile, m, 'error', { ruleId: RuleId.imageCopied });
          });
        }
        if (!fileName) continue;
      } else {
        const message = `Cannot find asset for '${attr}' "${attrPath}" in ${attrSourceFolder}`;
        addWarningForFile(session, sourceFile, message, 'error', {
          position: widgetNode.position,
          // TODO: add "asset exists" rule?
        });
        continue;
      }
      // Update mdast with new file name
      if (fileName !== undefined) {
        widgetNode[attr] = resolveOutputPath(fileName, writeFolder, altWriteFolder);
      }
    }
  }
}
