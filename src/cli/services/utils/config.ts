import path from 'path';
import * as fs from 'fs';
import { MyUser, Session } from '../../..';

function getConfigPath() {
  const pathArr: string[] = [];
  const local = ['curvenote', 'settings.json'];
  if (process.env.APPDATA) {
    pathArr.push(process.env.APPDATA);
  } else if (process.platform === 'darwin' && process.env.HOME) {
    pathArr.push(path.join(process.env.HOME, '.config'));
  } else if (process.env.HOME) {
    pathArr.push(process.env.HOME);
    if (local.length > 0) {
      local[0] = `.${local[0]}`;
    }
  }
  return path.join(...pathArr, ...local);
}

export async function setToken(token: string) {
  const session = new Session(token);
  let me;
  try {
    me = await new MyUser(session).get();
  } catch (error) {
    throw new Error('There was a problem with the token');
  }
  if (!me.data.email_verified) throw new Error('Your account is not activated');
  const configPath = getConfigPath();
  const data = {
    token,
  };
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(data));
}

export function deleteToken() {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) throw new Error('There is no token set');
  fs.unlinkSync(configPath);
}

export function getToken(): string | undefined {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return undefined;
  try {
    const data = JSON.parse(fs.readFileSync(configPath).toString());
    return data.token;
  } catch (error) {
    throw new Error('Could not read settings');
  }
}
