import { makeExecutable } from 'myst-cli-utils';
import { fsExists } from './fsExists.js';

export async function checkFolderIsGit(): Promise<boolean> {
  try {
    await makeExecutable('git status', null)();
    return true;
  } catch (error) {
    return false;
  }
}

export async function checkIgnore(pattern: string): Promise<boolean> {
  try {
    await makeExecutable(`git check-ignore ${pattern}`, null)();
    return true;
  } catch (error) {
    return false;
  }
}

export async function checkAtGitRoot(): Promise<boolean> {
  return await fsExists('.git');
}
