import { z } from 'zod';
import { notNullish } from '../../utils/defined.js';
import type { Config, ProjectConfig, SiteConfig } from 'myst-config';
import { ExportFormats } from 'myst-frontmatter';
import { parse } from 'node:path';

const JupyterBookConfig = z.object({
  title: z.string().nullish(),
  author: z.string().nullish(),
  copyright: z.string().nullish(),
  logo: z.string().nullish(),
  exclude_patterns: z.array(z.string()).nullish(),
  parse: z
    .object({
      myst_enable_extensions: z.union([z.null(), z.array(z.string())]).nullish(),
      myst_url_schemes: z.union([z.null(), z.array(z.string())]).nullish(),
      myst_dmath_double_inline: z.boolean().default(true),
    })
    .nullish(),
  execute: z
    .object({
      eval_regex: z.string().default('^.*$'),
      raise_on_error: z.boolean().default(false),
      show_tb: z.boolean().default(false),
      execute_notebooks: z
        .union([
          z.literal('auto'),
          z.literal('cache'),
          z.literal('force'),
          z.literal('inline'),
          z.literal('off'),
          z.literal(false),
        ])
        .default('auto'),
      cache: z.string().nullish(),
      timeout: z.number().gte(-1).default(30),
      allow_errors: z.boolean().default(false),
      stderr_output: z
        .enum(['show', 'remove', 'remove-warn', 'warn', 'error', 'severe'])
        .default('show'),
      run_in_temp: z.boolean().default(false),
      exclude_patterns: z.array(z.string()).nullish(),
    })
    .nullish(),
  html: z
    .object({
      favicon: z.string().nullish(),
      use_edit_page_button: z.boolean().nullish(),
      use_repository_button: z.boolean().nullish(),
      use_issues_button: z.boolean().nullish(),
      extra_footer: z.string().nullish(),
      // Legacy analytics field
      google_analytics_id: z.string().nullish(),
      analytics: z
        .object({
          plausible_analytics_domain: z.string().nullish(),
          google_analytics_id: z.string().nullish(),
        })
        .nullish(),
      home_page_in_navbar: z.boolean().nullish(),
      baseurl: z.string().nullish(),
      comments: z
        .object({
          hypothesis: z.union([z.boolean(), z.record(z.any())]).nullish(),
          utterances: z.union([z.boolean(), z.record(z.any())]).nullish(),
        })
        .nullish(),
      announcement: z.string().nullish(),
    })
    .nullish(),
  latex: z
    .object({
      latex_engine: z.string().default('pdflatex'),
      use_jupyterbook_latex: z.boolean().nullish(),
      latex_documents: z
        .object({
          targetname: z.string().nullish(),
        })
        .nullish(),
    })
    .nullish(),
  bibtex_bibfiles: z.array(z.string()).nullish(),
  launch_buttons: z
    .object({
      notebook_interface: z.string().nullish(),
      binderhub_url: z.string().nullish(),
      jupyterhub_url: z.string().nullish(),
      thebe: z.boolean().nullish(),
      colab_url: z.string().nullish(),
    })
    .nullish(),
  repository: z
    .object({
      url: z.string().nullish(),
      path_to_book: z.string().nullish(),
      branch: z.string().nullish(),
    })
    .nullish(),
  sphinx: z
    .object({
      extra_extensions: z.union([z.null(), z.array(z.string())]).nullish(),
      local_extensions: z.union([z.null(), z.record(z.any())]).nullish(),
      recursive_update: z.boolean().nullish(),
      config: z.union([z.null(), z.record(z.any())]).nullish(),
    })
    .nullish(),
});

export type JupyterBookConfig = z.infer<typeof JupyterBookConfig>;

/**
 * Validate a loaded Jupyter Book _config.yml, or return undefined
 *
 * @param config - config object
 */
export function validateJupyterBookConfig(config: unknown): JupyterBookConfig {
  const result = JupyterBookConfig.safeParse(config);
  if (!result.success) {
    const errors = result.error.errors.map(
      (issue) => `${issue.path.join('.')}: ${issue.message} (${issue.code})`,
    );
    throw new Error(`Error(s) in parsing Jupyter Book configuration:\n${errors}`);
  } else {
    return result.data;
  }
}

/**
 * Parse a GitHub repo URL to extract the user/repo substring
 *
 * @param url - GitHub URL
 */
function parseGitHubRepoURL(url: string): string | undefined {
  //eslint-disable-next-line
  const match = url.match(/(?:git@|https:\/\/)github.com[:\/](.*)(?:.git)?/);
  if (!match) {
    return undefined;
  }
  return match[1];
}

/**
 * Upgrade a Jupyter Book _config.yml into a myst.yml configuration
 *
 * @param config - validated Jupyter Book configuration
 */
export function upgradeConfig(data: JupyterBookConfig): Pick<Config, 'project' | 'site'> {
  const project: ProjectConfig = {};
  const siteOptions: SiteConfig['options'] = {};
  const site: SiteConfig = {
    options: siteOptions,
    template: 'book-theme',
  };

  if (notNullish(data.title)) {
    project.title = data.title;
  }

  if (notNullish(data.author)) {
    // Try and parse comma-delimited author lists into separate authors
    const authors = data.author.split(/,\s*(?:and\s)?\s*|\s+and\s+/);
    if (authors.length === 1) {
      project.authors = [{ name: data.author }]; // TODO prompt user for alias?
    } else {
      project.authors = authors.map((name) => ({ name }));
    }
  }

  if (notNullish(data.copyright)) {
    project.copyright = data.copyright;
  }

  if (notNullish(data.logo)) {
    siteOptions.logo = data.logo;
  }

  if (notNullish(data.exclude_patterns)) {
    project.exclude = data.exclude_patterns;
  }

  if (notNullish(data.html?.favicon)) {
    siteOptions.favicon = data.html.favicon;
  }

  if (notNullish(data.html?.analytics?.google_analytics_id)) {
    siteOptions.analytics_google = data.html.analytics.google_analytics_id;
  } else if (notNullish(data.html?.google_analytics_id)) {
    siteOptions.analytics_google = data.html.google_analytics_id;
  }

  if (notNullish(data.html?.analytics?.plausible_analytics_domain)) {
    siteOptions.analytics_plausible = data.html.analytics.plausible_analytics_domain;
  }

  const repo = notNullish(data.repository?.url)
    ? parseGitHubRepoURL(data.repository?.url)
    : undefined;
  if (notNullish(repo)) {
    project.github = repo;
  }

  // Do we want to enable thebe and mybinder?
  if (
    notNullish(repo) &&
    (notNullish(data.launch_buttons?.binderhub_url) || !!data.launch_buttons?.thebe)
  ) {
    project.thebe = {
      binder: {
        repo: repo,
        provider: 'github',
        url: data.launch_buttons?.binderhub_url ?? undefined,
        ref: data.repository?.branch ?? undefined,
      },
    };
  }

  // Take bibliography
  if (notNullish(data.bibtex_bibfiles)) {
    project.bibliography = data.bibtex_bibfiles;
  }

  // Defined LaTeX target name
  if (notNullish(data.latex?.latex_documents?.targetname)) {
    project.exports = project.exports ?? [];

    // Strip any extensions
    const { name } = parse(data.latex.latex_documents.targetname);
    project.exports.push({
      format: ExportFormats.pdf,
      template: 'plain_latex_book',
      output: `exports/${name}.pdf`,
    });
  }

  return { project, site };
}
