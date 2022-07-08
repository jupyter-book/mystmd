export function assertEndsInExtension(filename: string, extension: string) {
  if (!filename.endsWith(`.${extension}`))
    throw new Error(`The filename must end with '.${extension}': "${filename}"`);
}
