import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export interface ICache<T> {
  test(key: string): boolean;

  get(key: string): T | undefined;

  set(key: string, value: T): void;
}

/**
 * An implementation of a basic cache
 */
export class LocalDiskCache<T> implements ICache<T> {
  constructor(cachePath: string) {
    this._cachePath = cachePath;

    if (!existsSync(cachePath)) {
      mkdirSync(cachePath, { recursive: true });
    }
  }

  private readonly _cachePath: string;

  private _makeKeyPath(key: string): string {
    return path.join(this._cachePath, `${key}.json`);
  }

  test(key: string): boolean {
    return existsSync(this._makeKeyPath(key));
  }

  get(key: string): T | undefined {
    const keyPath = this._makeKeyPath(key);
    if (!existsSync(keyPath)) {
      return undefined;
    }
    const data = readFileSync(keyPath, { encoding: 'utf8' });
    return JSON.parse(data);
  }

  set(key: string, item: T) {
    const data = JSON.stringify(item);
    const keyPath = this._makeKeyPath(key);
    return writeFileSync(keyPath, data, { encoding: 'utf8' });
  }
}
