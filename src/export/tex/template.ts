import fs from 'fs';
import { sync as which } from 'which';
import YAML from 'yaml';
import { Template } from '../../models';
import { Session } from '../../session/session';
import { TexExportOptions } from './types';

export function throwIfTemplateButNoJtex(opts: TexExportOptions) {
  if (opts.template && !which('jtex', { nothrow: true })) {
    throw new Error(
      'A template option was specified but the `jtex` command was not found on the path.\nTry `pip install jtex`!',
    );
  }
}

export async function fetchTemplateTaggedBlocks(
  session: Session,
  opts: TexExportOptions,
): Promise<{ tagged: string[] }> {
  let tagged: string[] = [];
  if (opts.template) {
    session.$logger.debug(`Fetching template spec for "${opts.template}"`);
    const template = await new Template(session, opts.template).get();
    tagged = template.data.config.tagged.map((t) => t.id);
    session.$logger.debug(
      `Template '${opts.template}' supports following tagged content: ${tagged.join(', ')}`,
    );
  }
  return { tagged };
}

export function loadTemplateOptions(opts: TexExportOptions): Record<string, any> {
  if (opts.options) {
    if (!fs.existsSync(opts.options)) {
      throw new Error(`The template options file specified was not found: ${opts.options}`);
    }
    // TODO validate against the options schema here
    return YAML.parse(fs.readFileSync(opts.options as string, 'utf8')) as Record<string, any>;
  }
  return {};
}
