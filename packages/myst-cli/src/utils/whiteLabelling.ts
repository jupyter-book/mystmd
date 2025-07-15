export function readableName(): string {
  if ('MYSTMD_READABLE_NAME' in process.env) {
    const name = process.env.MYSTMD_READABLE_NAME as string;
    return `${name} (via myst)`;
  } else {
    return 'MyST';
  }
}

export function binaryName(): string {
  return (process.env.MYSTMD_BINARY_NAME ?? 'myst') as string;
}

export function npmPackageName(): string {
  return (process.env.MYSTMD_NPM_PACKAGE_NAME ?? 'mystmd') as string;
}

export function npmBinaryName(): string {
  return (process.env.MYSTMD_NPM_BINARY_NAME ?? 'myst') as string;
}

export function homeURL(): string {
  return (process.env.MYSTMD_HOME_URL ?? 'https://mystmd.org') as string;
}

export function isWhiteLabelled(): boolean {
  return ['MYSTMD_READABLE_NAME', 'MYSTMD_BINARY_NAME'].some((name) => name in process.env);
}
