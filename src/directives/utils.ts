
export const unusedOptionsWarning = (kind: string, opts: Record<string, any>) => {
  if (Object.keys(opts).length > 0) {
    console.warn(`Unknown ${kind} options`, opts);
  }
};
