import path from 'path';

export function removeExtension(file: string): string {
  const { ext } = path.parse(file);
  if (ext) file = file.slice(0, file.length - ext.length);
  return file;
}
