import path from 'path';

/**
 * pkgpath - easily get package relative paths
 *
 * @param absPathSegment an absolute path from the package root level
 * @returns full absolute path
 */
export default function pkgpath(absPathSegment: string) {
  return path.join(__dirname, absPathSegment);
}
