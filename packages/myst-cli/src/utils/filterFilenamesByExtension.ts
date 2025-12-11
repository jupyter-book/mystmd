import path from 'node:path';

export function filterFilenamesByExtension(filenames: Record<string, string>, ext: string) {
  return Object.entries(filenames).filter(([, filename]) => {
    return path.extname(filename).toLowerCase() === ext;
  });
}
