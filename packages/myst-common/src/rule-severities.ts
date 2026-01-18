// ******************************************************
// ***                                                ***
// ***   THIS FILE IS AUTO-GENERATED. DO NOT EDIT.    ***
// ***                                                ***
// ***   To update, run:                              ***
// ***   npm run generate:rule-severities             ***
// ***                                                ***
// ******************************************************

import { RuleId } from './ruleids.js';

/**
 * Default severity levels for each rule ID.
 * These represent how the rule is used in the codebase when no error_rules override is specified.
 *
 * - 'error': Indicates a critical issue that prevents proper operation
 * - 'warn': Indicates a problem that should be addressed but doesn't prevent operation
 * - 'ignore': Not used as a default, only available through configuration
 *
 * @see scripts/generate-rule-severities.mjs for the generation script
 */
export const RULE_DEFAULT_SEVERITY: Record<RuleId, 'error' | 'warn'> = {
  // Frontmatter rules
  [RuleId.validConfigStructure]: 'error', // fileError, validationOpts in packages/myst-cli/src/config.ts
  [RuleId.siteConfigExists]: 'error', // addWarningForFile in packages/myst-cli/src/config.ts
  [RuleId.projectConfigExists]: 'warn', // addWarningForFile in packages/myst-cli/src/project/load.ts
  [RuleId.validSiteConfig]: 'error', // Uses both error (2×) and warn (1×); addWarningForFile, validationOpts in packages/myst-cli/src/bu...
  [RuleId.validProjectConfig]: 'error', // validationOpts in packages/myst-cli/src/config.ts
  [RuleId.configHasNoDeprecatedFields]: 'error', // Uses both error (2×) and warn (5×); fileError, fileWarn, errorLogFn, warningLogFn in packages/mys...
  [RuleId.frontmatterIsYaml]: 'error', // fileError in packages/myst-transforms/src/frontmatter.ts
  [RuleId.validPageFrontmatter]: 'error', // Uses both error (6×) and warn (7×); fileError, fileWarn, errorLogFn, warningLogFn in packages/mys...
  [RuleId.validFrontmatterExportList]: 'error', // Uses both error (1×) and warn (2×); fileError, fileWarn in packages/myst-cli/src/build/utils/coll...
  // Export rules
  [RuleId.docxRenders]: 'error', // Uses both error (5×) and warn (3×); fileError, fileWarn, errorLogFn, warningLogFn in packages/mys...
  [RuleId.jatsRenders]: 'error', // fileError in packages/myst-to-jats/src/index.ts
  [RuleId.mdRenders]: 'error', // Uses both error (6×) and warn (1×); fileError, fileWarn in packages/myst-to-md/src/directives.ts,...
  [RuleId.mecaIncludesJats]: 'warn', // fileWarn in packages/myst-cli/src/build/meca/index.ts
  [RuleId.mecaExportsBuilt]: 'warn', // fileWarn in packages/myst-cli/src/build/meca/index.ts
  [RuleId.mecaFilesCopied]: 'error', // fileError, errorLogFn in packages/myst-cli/src/build/meca/index.ts
  [RuleId.pdfBuildCommandsAvailable]: 'error', // fileError in packages/myst-cli/src/build/pdf/create.ts
  [RuleId.pdfBuildsWithoutErrors]: 'error', // fileError in packages/myst-cli/src/build/pdf/create.ts
  [RuleId.pdfBuilds]: 'error', // Uses both error (3×) and warn (2×); fileError, fileWarn, errorLogFn, warningLogFn in packages/mys...
  [RuleId.texRenders]: 'error', // Uses both error (9×) and warn (3×); addWarningForFile, fileError, fileWarn in packages/myst-cli/s...
  [RuleId.exportExtensionCorrect]: 'error', // Uses both error (1×) and warn (2×); fileError, fileWarn in packages/myst-cli/src/build/utils/coll...
  [RuleId.exportArticleExists]: 'error', // fileError in packages/myst-cli/src/build/utils/collectExportOptions.ts
  // Parse rules
  [RuleId.texParses]: 'error', // Uses both error (2×) and warn (4×); fileError, fileWarn in packages/tex-to-myst/src/parser.ts, pa...
  [RuleId.jatsParses]: 'error', // Uses both error (3×) and warn (1×); fileError, fileWarn in packages/jats-to-myst/src/index.ts, pa...
  [RuleId.mystFileLoads]: 'error', // addWarningForFile in packages/myst-cli/src/process/file.ts
  [RuleId.selectedFileIsProcessed]: 'error', // Uses both error (2×) and warn (1×); addWarningForFile, fileWarn in packages/myst-cli/src/process/...
  // Directive and role rules
  [RuleId.directiveRegistered]: 'warn', // fileWarn in packages/myst-parser/src/directives.ts
  [RuleId.directiveKnown]: 'error', // fileError in packages/myst-parser/src/directives.ts
  [RuleId.directiveArgumentCorrect]: 'error', // Uses both error (1×) and warn (2×); fileWarn, fileError in packages/myst-cli/src/transforms/raw.t...
  [RuleId.directiveOptionsCorrect]: 'error', // Uses both error (3×) and warn (9×); fileError, fileWarn in packages/myst-directives/src/code.ts, ...
  [RuleId.directiveBodyCorrect]: 'error', // Uses both error (4×) and warn (1×); fileError, fileWarn in packages/myst-directives/src/table.ts,...
  [RuleId.roleRegistered]: 'warn', // fileWarn in packages/myst-parser/src/roles.ts
  [RuleId.roleKnown]: 'error', // fileError in packages/myst-parser/src/roles.ts
  [RuleId.roleBodyCorrect]: 'error', // Uses both error (1×) and warn (4×); fileWarn, fileError in packages/myst-ext-button/src/index.ts,...
  // Project structure rules
  [RuleId.tocContentsExist]: 'error', // Uses both error (2×) and warn (2×); addWarningForFile in packages/myst-cli/src/project/fromTOC.ts
  [RuleId.encounteredLegacyTOC]: 'warn', // addWarningForFile in packages/myst-cli/src/project/load.ts
  [RuleId.validTOCStructure]: 'error', // addWarningForFile in packages/myst-cli/src/utils/toc.ts
  [RuleId.validTOC]: 'warn', // addWarningForFile in packages/myst-cli/src/project/fromPath.ts
  // Image rules
  [RuleId.imageDownloads]: 'error', // addWarningForFile in packages/myst-cli/src/transforms/images.ts
  [RuleId.imageExists]: 'error', // addWarningForFile in packages/myst-cli/src/transforms/images.ts
  [RuleId.imageFormatConverts]: 'error', // Uses both error (7×) and warn (1×); addWarningForFile in packages/myst-cli/src/transforms/images....
  [RuleId.imageCopied]: 'error', // addWarningForFile in packages/myst-cli/src/transforms/images.ts
  [RuleId.imageFormatOptimizes]: 'warn', // addWarningForFile in packages/myst-cli/src/utils/imagemagick.ts
  // Math rules
  [RuleId.mathLabelLifted]: 'warn', // fileWarn in packages/myst-transforms/src/math.ts
  [RuleId.mathEquationEnvRemoved]: 'warn', // fileWarn in packages/myst-transforms/src/math.ts
  [RuleId.mathEqnarrayReplaced]: 'warn', // fileWarn in packages/myst-transforms/src/math.ts
  [RuleId.mathAlignmentAdjusted]: 'warn', // fileWarn in packages/myst-transforms/src/math.ts
  [RuleId.mathRenders]: 'error', // Uses both error (1×) and warn (2×); fileError, fileWarn in packages/myst-transforms/src/math.ts
  // Reference rules
  [RuleId.referenceTemplateFills]: 'warn', // fileWarn in packages/myst-transforms/src/enumerate.ts
  [RuleId.identifierIsUnique]: 'warn', // addWarningForFile, fileWarn in packages/myst-cli/src/process/site.ts, packages/myst-transforms/sr...
  [RuleId.referenceTargetResolves]: 'warn', // fileWarn in packages/myst-transforms/src/enumerate.ts
  [RuleId.referenceSyntaxValid]: 'warn', // fileWarn in packages/myst-transforms/src/enumerate.ts
  [RuleId.referenceTargetExplicit]: 'warn', // fileWarn in packages/myst-transforms/src/enumerate.ts
  [RuleId.footnoteReferencesDefinition]: 'warn', // fileWarn in packages/myst-transforms/src/footnotes.ts
  [RuleId.intersphinxReferencesResolve]: 'error', // fileError in packages/myst-cli/src/process/loadReferences.ts
  // Link rules
  [RuleId.mystLinkValid]: 'error', // Uses both error (4×) and warn (3×); fileWarn, fileError in packages/myst-cli/src/transforms/cross...
  [RuleId.sphinxLinkValid]: 'error', // fileError in packages/myst-transforms/src/links/sphinx.ts
  [RuleId.rridLinkValid]: 'warn', // fileWarn in packages/myst-transforms/src/links/rrid.ts
  [RuleId.rorLinkValid]: 'error', // Uses both error (1×) and warn (1×); fileError, fileWarn in packages/myst-cli/src/transforms/ror.t...
  [RuleId.wikipediaLinkValid]: 'error', // Uses both error (1×) and warn (2×); fileError, fileWarn in packages/myst-transforms/src/links/wik...
  [RuleId.doiLinkValid]: 'error', // fileError in packages/myst-cli/src/transforms/dois.ts, packages/myst-transforms/src/links/doi.ts
  [RuleId.linkResolves]: 'error', // addWarningForFile in packages/myst-cli/src/transforms/links.ts
  [RuleId.linkTextExists]: 'error', // Uses both error (1×) and warn (2×); fileError, fileWarn in packages/myst-transforms/src/links/che...
  // Notebook rules
  [RuleId.notebookAttachmentsResolve]: 'warn', // fileWarn in packages/myst-cli/src/process/notebook.ts
  [RuleId.notebookOutputCopied]: 'error', // fileError in packages/myst-cli/src/transforms/outputs.ts
  // Content rules
  [RuleId.mdastSnippetImports]: 'error', // addWarningForFile in packages/myst-cli/src/transforms/mdast.ts
  [RuleId.includeContentFilters]: 'warn', // fileWarn in packages/myst-transforms/src/include.ts
  [RuleId.includeContentLoads]: 'error', // fileError in packages/myst-cli/src/transforms/include.ts, packages/myst-transforms/src/include.ts
  [RuleId.gatedNodesJoin]: 'error', // Uses both error (1×) and warn (1×); fileError, fileWarn in packages/myst-transforms/src/joinGates.ts
  [RuleId.glossaryUsesDefinitionList]: 'error', // fileError in packages/myst-transforms/src/glossary.ts
  [RuleId.blockMetadataLoads]: 'error', // addWarningForFile, fileError in packages/myst-cli/src/session/session.spec.ts, packages/myst-tran...
  [RuleId.indexEntriesResolve]: 'warn', // fileWarn in packages/myst-transforms/src/indices.ts
  // Citation rules
  [RuleId.citationIsUnique]: 'warn', // addWarningForFile in packages/myst-cli/src/process/citations.ts
  [RuleId.bibFileExists]: 'error', // Uses both error (5×) and warn (1×); addWarningForFile in packages/myst-cli/src/project/load.ts, p...
  [RuleId.citationRenders]: 'error', // addWarningForFile in packages/myst-cli/src/transforms/citations.ts
  // Code rules
  [RuleId.codeMetadataLifted]: 'warn', // fileWarn in packages/myst-cli/src/transforms/code.ts
  [RuleId.codeMetatagsValid]: 'error', // Uses both error (1×) and warn (2×); fileError, fileWarn in packages/myst-cli/src/transforms/code.ts
  [RuleId.codeLangDefined]: 'warn', // fileWarn in packages/myst-transforms/src/code.ts
  [RuleId.codeMetadataLoads]: 'error', // fileError in packages/myst-cli/src/transforms/code.ts
  [RuleId.inlineCodeMalformed]: 'warn', // fileWarn in packages/myst-transforms/src/code.ts
  [RuleId.inlineExpressionRenders]: 'warn', // fileWarn in packages/myst-cli/src/transforms/inlineExpressions.ts
  // Static file rules
  [RuleId.staticFileCopied]: 'error', // fileError in packages/myst-cli/src/transforms/links.ts
  [RuleId.exportFileCopied]: 'error', // addWarningForFile in packages/myst-cli/src/build/site/manifest.ts
  [RuleId.sourceFileCopied]: 'error', // addWarningForFile in packages/myst-cli/src/process/site.ts
  [RuleId.templateFileCopied]: 'error', // addWarningForFile in packages/myst-cli/src/build/site/manifest.ts
  [RuleId.staticActionFileCopied]: 'error', // addWarningForFile in packages/myst-cli/src/build/site/manifest.ts
  [RuleId.pluginLoads]: 'error', // addWarningForFile in packages/myst-cli/src/plugins.ts
  // Container rules
  [RuleId.containerChildrenValid]: 'error', // Uses both error (5×) and warn (1×); fileError, fileWarn in packages/myst-transforms/src/container...
  // File rules
  [RuleId.mystJsonValid]: 'error', // Uses both error (2×) and warn (2×); fileError, fileWarn, errorLogFn, warningLogFn in packages/mys...
  [RuleId.codeCellExecutes]: 'error', // fileError in packages/myst-execute/src/execute.ts
  [RuleId.inlineExpressionExecutes]: 'error', // fileError in packages/myst-execute/src/execute.ts
};
