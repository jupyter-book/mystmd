import fs from 'node:fs';
import { makeExecutable } from 'myst-cli-utils';

export async function checkFolderIsGit(): Promise<boolean> {
  try {
    await makeExecutable('git status', null)();
    return true;
  } catch (error) {
    return false;
  }
}

export async function checkAtGitRoot(): Promise<boolean> {
  try {
    fs.readdirSync('.git');
    return true;
  } catch (error) {
    return false;
  }
}
