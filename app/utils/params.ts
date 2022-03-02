import config from '~/config.json';

export function getFolder(folderName?: string) {
  if (!folderName || !(folderName in config.folders)) return undefined;
  return config.folders[folderName as keyof typeof config.folders];
}
