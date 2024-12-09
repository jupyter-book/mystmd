import fs from 'node:fs';
import path from 'node:path';
import which from 'which';
import type { LoggerDE } from 'myst-cli-utils';
import { makeExecutable } from 'myst-cli-utils';
import { RuleId } from 'myst-common';
import type { ISession } from '../session/types.js';
import { addWarningForFile } from './addWarningForFile.js';

function createFfmpegLogger(session: ISession): LoggerDE {
  const logger = {
    debug(data: string) {
      const line = data.trim();
      session.log.debug(line);
    },
    error(data: string) {
      const line = data.trim();
      if (!line) return;
      // All ffmpeg logging comes through as errors, convert all to debug
      session.log.debug(data);
    },
  };
  return logger;
}

export function isFfmpegAvailable(): boolean {
  return !!which.sync('ffmpeg', { nothrow: true });
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
    const ffmpegCommand = `ffmpeg -i ${input} -crf 18 -vf "crop=trunc(iw/2)*2:trunc(ih/2)*2" ${output}`;
    session.log.debug(`Executing: ${ffmpegCommand}`);
    const exec = makeExecutable(ffmpegCommand, createFfmpegLogger(session));
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
