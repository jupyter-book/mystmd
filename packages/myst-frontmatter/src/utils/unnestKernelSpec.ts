/**
 * Unnest `kernelspec` from `jupyter.kernelspec`
 */
export function unnestKernelSpec(pageFrontmatter: Record<string, any>) {
  if (pageFrontmatter.jupyter?.kernelspec) {
    // TODO: When we are exporting from local state, we will need to be more careful to
    // round-trip this correctly.
    pageFrontmatter.kernelspec = pageFrontmatter.jupyter.kernelspec;
    // This cleanup prevents warning on `jupyter.kernelspec` but keeps warnings if other
    // keys exist under `jupyter`
    delete pageFrontmatter.jupyter.kernelspec;
    if (!Object.keys(pageFrontmatter.jupyter).length) {
      delete pageFrontmatter.jupyter;
    }
  }
}
