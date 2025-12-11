import fs from 'node:fs';
import path from 'node:path';
import which from 'which';
import type { LoggerDE } from 'myst-cli-utils';
import { makeExecutable } from 'myst-cli-utils';
import { RuleId } from 'myst-common';
import type { ISession } from '../session/types.js';
import { addWarningForFile } from './addWarningForFile.js';

function createInkscpapeLogger(session: ISession): LoggerDE {
  const logger = {
    debug(data: string) {
      const line = data.trim();
      session.log.debug(line);
    },
    error(data: string) {
      const line = data.trim();
      if (!line) return;
      // These are non-critical errors that don't need to be in the CLI log
      if (line.includes('unsupported target') || line.includes('writable cache directories')) {
        session.log.debug(line);
        return;
      }
      session.log.error(data);
    },
  };
  return logger;
}

export function isInkscapeAvailable(): boolean {
  return !!which.sync('inkscape', { nothrow: true });
}

export async function convert(
  inputExtension: string,
  outputExtension: string,
  session: ISession,
  input: string,
  writeFolder: string,
) {
  if (!fs.existsSync(input)) return null;
  const { name, ext } = path.parse(input);
  if (ext !== inputExtension) return null;
  const filename = `${name}${outputExtension}`;
  const output = path.join(writeFolder, filename);
  const inputFormatUpper = inputExtension.slice(1).toUpperCase();
  const outputFormat = outputExtension.slice(1);
  if (fs.existsSync(output)) {
    session.log.debug(`Cached file found for converted ${inputFormatUpper}: ${input}`);
  } else {
    const inkscapeCommand = `inkscape ${input} --export-area-drawing --export-type=${outputFormat} --export-filename=${output}`;
    session.log.debug(`Executing: ${inkscapeCommand}`);
    const exec = makeExecutable(inkscapeCommand, createInkscpapeLogger(session));
    try {
      await exec();
    } catch (err) {
      addWarningForFile(
        session,
        input,
        `Could not convert from ${inputFormatUpper} to ${outputFormat.toUpperCase()} - ${err}`,
        'error',
        { ruleId: RuleId.imageFormatConverts },
      );
      return null;
    }
  }
  return filename;
}

// EPS conversion functions do not work from the inkscape cli:
// See: https://gitlab.com/inkscape/inkscape/-/issues/3524

// export async function convertEpsToPdf(session: ISession, input: string, writeFolder: string) {
//   const output = await convert('.eps', '.pdf', session, input, writeFolder);
//   return output;
// }

// export async function convertEpsToSvg(session: ISession, input: string, writeFolder: string) {
//   const output = await convert('.eps', '.svg', session, input, writeFolder);
//   return output;
// }

// export async function convertEpsToPng(session: ISession, input: string, writeFolder: string) {
//   const output = await convert('.eps', '.png', session, input, writeFolder);
//   return output;
// }
