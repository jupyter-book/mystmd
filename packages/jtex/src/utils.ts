export function createCommand(baseCommand: string, logFile: string): string {
  return process.platform === 'win32'
    ? `${baseCommand} 1> ${logFile} 2>&1`
    : `${baseCommand} &> ${logFile}`;
}
