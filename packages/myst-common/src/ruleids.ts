export enum RuleId {
  // Frontmatter rules
  validConfigStructure = 'valid-config-structure',
  siteConfigExists = 'site-config-exists',
  projectConfigExists = 'project-config-exists',
  validSiteConfig = 'valid-site-config',
  validProjectConfig = 'valid-project-config',
  configHasNoDeprecatedFields = 'config-has-no-deprecated-fields',
  frontmatterIsYaml = 'frontmatter-is-yaml',
  validPageFrontmatter = 'valid-page-frontmatter',
  validFrontmatterExportList = 'valid-frontmatter-export-list',
  // Export rules
  docxRenders = 'docx-renders',
  jatsRenders = 'jats-renders',
  mdRenders = 'md-renders',
  mecaIncludesJats = 'meca-includes-jats',
  mecaExportsBuilt = 'meca-exports-built',
  mecaFilesCopied = 'meca-files-copied',
  pdfBuildCommandsAvailable = 'pdf-build-commands-available',
  pdfBuildsWithoutErrors = 'pdf-builds-without-errors',
  pdfBuilds = 'pdf-builds',
  texRenders = 'tex-renders',
  exportExtensionCorrect = 'export-extension-correct',
  exportArticleExists = 'export-article-exists',
  // Parse rules
  texParses = 'tex-parses',
  jatsParses = 'jats-parses',
  mystFileLoads = 'myst-file-loads',
  selectedFileIsProcessed = 'selected-file-is-processed',
  // Directive and role rules
  directiveRegistered = 'directive-registered',
  directiveKnown = 'directive-known',
  directiveArgumentCorrect = 'directive-argument-correct',
  directiveOptionsCorrect = 'directive-options-correct',
  directiveBodyCorrect = 'directive-body-correct',
  roleRegistered = 'role-registered',
  roleKnown = 'role-known',
  roleBodyCorrect = 'role-body-correct',
  // Project structure rules
  tocContentsExist = 'toc-contents-exist',
  encounteredLegacyTOC = 'encountered-legacy-toc',
  validTOCStructure = 'valid-toc-structure',
  validTOC = 'valid-toc',
  tocWritten = 'toc-written',
  // Image rules
  imageDownloads = 'image-downloads',
  imageExists = 'image-exists',
  imageFormatConverts = 'image-format-converts',
  imageCopied = 'image-copied',
  imageFormatOptimizes = 'image-format-optimizes',
  // Math rules
  mathLabelLifted = 'math-label-lifted',
  mathEquationEnvRemoved = 'math-equation-env-removed',
  mathEqnarrayReplaced = 'math-eqnarray-replaced',
  mathAlignmentAdjusted = 'math-alignment-adjusted',
  mathRenders = 'math-renders',
  // Reference rules
  referenceTemplateFills = 'reference-template-fills',
  identifierIsUnique = 'identifier-is-unique',
  referenceTargetResolves = 'reference-target-resolves',
  referenceSyntaxValid = 'reference-syntax-valid',
  referenceTargetExplicit = 'reference-target-explicit',
  footnoteReferencesDefinition = 'footnote-references-definition',
  intersphinxReferencesResolve = 'intersphinx-references-resolve',
  // Link rules
  mystLinkValid = 'myst-link-valid',
  sphinxLinkValid = 'sphinx-link-valid',
  rridLinkValid = 'rrid-link-valid',
  rorLinkValid = 'ror-link-valid',
  wikipediaLinkValid = 'wikipedia-link-valid',
  doiLinkValid = 'doi-link-valid',
  linkResolves = 'link-resolves',
  linkTextExists = 'link-text-exists',
  // Notebook rules
  notebookAttachmentsResolve = 'notebook-attachments-resolve',
  notebookOutputCopied = 'notebook-output-copied',
  // Content rules
  mdastSnippetImports = 'mdast-snippet-imports',
  includeContentFilters = 'include-content-filters',
  includeContentLoads = 'include-content-loads',
  gatedNodesJoin = 'gated-nodes-join',
  glossaryUsesDefinitionList = 'glossary-uses-definition-list',
  blockMetadataLoads = 'block-metadata-loads',
  indexEntriesResolve = 'index-entries-resolve',
  // Citation rules
  citationIsUnique = 'citation-is-unique',
  bibFileExists = 'bib-file-exists',
  citationRenders = 'citation-renders',
  // Code rules
  codeMetadataLifted = 'code-metadata-lifted',
  codeMetatagsValid = 'code-metatags-valid',
  codeLangDefined = 'code-lang-defined',
  codeMetadataLoads = 'code-metadata-loads',
  inlineCodeMalformed = 'inline-code-malformed',
  inlineExpressionRenders = 'inline-expression-renders',
  // Static file rules
  staticFileCopied = 'static-file-copied',
  exportFileCopied = 'export-file-copied',
  sourceFileCopied = 'source-file-copied',
  templateFileCopied = 'template-file-copied',
  staticActionFileCopied = 'static-action-file-copied',
  // Plugins
  pluginLoads = 'plugin-loads',
  pluginExecutionFailed = 'plugin-execution-failed',
  // Container rules
  containerChildrenValid = 'container-children-valid',
  // File rules
  mystJsonValid = 'myst-json-valid',
}

/**
 * Descriptions for each rule ID.
 * TypeScript will enforce that every RuleId has a corresponding description.
 */
export const RULE_ID_DESCRIPTIONS: Record<RuleId, string> = {
  // Frontmatter rules
  [RuleId.validConfigStructure]: 'Configuration file structure is valid and can be parsed',
  [RuleId.siteConfigExists]: 'Site configuration is found in project',
  [RuleId.projectConfigExists]: 'Project configuration file exists in the directory',
  [RuleId.validSiteConfig]: 'Site configuration passes validation',
  [RuleId.validProjectConfig]: 'Project configuration passes validation',
  [RuleId.configHasNoDeprecatedFields]:
    'Configuration uses current field names without deprecated options',
  [RuleId.frontmatterIsYaml]: 'Frontmatter can be parsed as valid YAML',
  [RuleId.validPageFrontmatter]: 'Page frontmatter passes validation',
  [RuleId.validFrontmatterExportList]:
    'Export list in frontmatter is valid for the specified format',
  // Export rules
  [RuleId.docxRenders]: 'DOCX document renders without errors',
  [RuleId.jatsRenders]: 'JATS XML renders without errors',
  [RuleId.mdRenders]: 'Markdown output renders without errors',
  [RuleId.mecaIncludesJats]: 'MECA bundle contains required JATS file',
  [RuleId.mecaExportsBuilt]: 'MECA archive builds without errors',
  [RuleId.mecaFilesCopied]: 'MECA files copy to output successfully',
  [RuleId.pdfBuildCommandsAvailable]: 'Required PDF build tools (LaTeX/Typst) are installed',
  [RuleId.pdfBuildsWithoutErrors]: 'PDF compilation completes without LaTeX/Typst errors',
  [RuleId.pdfBuilds]: 'PDF file generates successfully',
  [RuleId.texRenders]: 'LaTeX/Typst document renders without errors',
  [RuleId.exportExtensionCorrect]: 'Export file has the correct extension for its format',
  [RuleId.exportArticleExists]: 'Article file specified in export configuration exists',
  // Parse rules
  [RuleId.texParses]: 'LaTeX content parses without syntax errors',
  [RuleId.jatsParses]: 'JATS XML parses without syntax errors',
  [RuleId.mystFileLoads]: 'MyST markdown file loads and parses successfully',
  [RuleId.selectedFileIsProcessed]: 'File specified for processing is found and processed',
  // Directive and role rules
  [RuleId.directiveRegistered]: 'Directive is registered without name conflicts',
  [RuleId.directiveKnown]: 'Directive name is recognized',
  [RuleId.directiveArgumentCorrect]: 'Directive argument matches specification',
  [RuleId.directiveOptionsCorrect]: 'Directive options are valid and properly formatted',
  [RuleId.directiveBodyCorrect]: 'Directive body content meets requirements',
  [RuleId.roleRegistered]: 'Role is registered without name conflicts',
  [RuleId.roleKnown]: 'Role name is recognized',
  [RuleId.roleBodyCorrect]: 'Role content meets requirements',
  // Project structure rules
  [RuleId.tocContentsExist]: 'Files referenced in table of contents exist',
  [RuleId.encounteredLegacyTOC]: 'Table of contents uses deprecated format',
  [RuleId.validTOCStructure]: 'Table of contents structure passes schema validation',
  [RuleId.validTOC]: 'Table of contents is valid',
  [RuleId.tocWritten]: 'Table of contents writes to disk successfully',
  // Image rules
  [RuleId.imageDownloads]: 'Remote image downloads successfully',
  [RuleId.imageExists]: 'Image file exists at specified path',
  [RuleId.imageFormatConverts]: 'Image format converts successfully using available tools',
  [RuleId.imageCopied]: 'Image copies to output directory successfully',
  [RuleId.imageFormatOptimizes]: 'Image format optimizes successfully',
  // Math rules
  [RuleId.mathLabelLifted]: 'Math equation label extracts successfully',
  [RuleId.mathEquationEnvRemoved]: 'Nested equation environment removes successfully',
  [RuleId.mathEqnarrayReplaced]: 'Deprecated eqnarray environment replaces with align',
  [RuleId.mathAlignmentAdjusted]: 'Math alignment adjusts successfully',
  [RuleId.mathRenders]: 'Math expression renders with KaTeX without errors',
  // Reference rules
  [RuleId.referenceTemplateFills]: 'Reference template populates with values successfully',
  [RuleId.identifierIsUnique]: 'Identifier is unique across the project',
  [RuleId.referenceTargetResolves]: 'Cross-reference target is found',
  [RuleId.referenceSyntaxValid]: 'Reference syntax is valid',
  [RuleId.referenceTargetExplicit]: 'Reference target is explicitly specified',
  [RuleId.footnoteReferencesDefinition]: 'Footnote reference links to an existing definition',
  [RuleId.intersphinxReferencesResolve]:
    'Intersphinx cross-reference resolves to external documentation',
  // Link rules
  [RuleId.mystLinkValid]: 'MyST-formatted link is valid',
  [RuleId.sphinxLinkValid]: 'Sphinx-style link is valid',
  [RuleId.rridLinkValid]: 'RRID (Research Resource Identifier) link is valid',
  [RuleId.rorLinkValid]: 'ROR (Research Organization Registry) link is valid',
  [RuleId.wikipediaLinkValid]: 'Wikipedia link is valid',
  [RuleId.doiLinkValid]: 'DOI (Digital Object Identifier) link is valid',
  [RuleId.linkResolves]: 'Link URL resolves successfully',
  [RuleId.linkTextExists]: 'Link has non-empty text content',
  // Notebook rules
  [RuleId.notebookAttachmentsResolve]:
    'Jupyter notebook attachments resolve and decode successfully',
  [RuleId.notebookOutputCopied]: 'Notebook cell output copies to disk successfully',
  // Content rules
  [RuleId.mdastSnippetImports]: 'MDAST snippet imports successfully',
  [RuleId.includeContentFilters]: 'Include directive filters apply correctly',
  [RuleId.includeContentLoads]:
    'Include directive loads target file successfully without circular dependencies',
  [RuleId.gatedNodesJoin]: 'Conditional content nodes merge correctly',
  [RuleId.glossaryUsesDefinitionList]: 'Glossary directive contains a definition list',
  [RuleId.blockMetadataLoads]: 'Block-level metadata loads and parses successfully',
  [RuleId.indexEntriesResolve]: 'Index entries resolve successfully',
  // Citation rules
  [RuleId.citationIsUnique]: 'Citation identifier is unique across bibliography files',
  [RuleId.bibFileExists]: 'Bibliography file specified in configuration exists',
  [RuleId.citationRenders]: 'Citation processes with citation-js successfully',
  // Code rules
  [RuleId.codeMetadataLifted]: 'Code cell metadata extracts without conflicts',
  [RuleId.codeMetatagsValid]: 'Code cell tags are valid',
  [RuleId.codeLangDefined]: 'Code block has a language specified',
  [RuleId.codeMetadataLoads]: 'Code metadata loads successfully',
  [RuleId.inlineCodeMalformed]: 'Inline code has either value or children but not both',
  [RuleId.inlineExpressionRenders]: 'Inline expression evaluates successfully',
  // Static file rules
  [RuleId.staticFileCopied]: 'Static file copies to output successfully',
  [RuleId.exportFileCopied]: 'Export output file copies to public directory successfully',
  [RuleId.sourceFileCopied]: 'Source file copies to output successfully',
  [RuleId.templateFileCopied]: 'Template file copies successfully',
  [RuleId.staticActionFileCopied]: 'Static action file copies successfully',
  // Plugins
  [RuleId.pluginLoads]: 'Plugin loads and executes without errors',
  [RuleId.pluginExecutionFailed]: 'Plugin execution encounters an error',
  // Container rules
  [RuleId.containerChildrenValid]: 'Container has valid child elements',
  // File rules
  [RuleId.mystJsonValid]: 'MyST JSON file is valid',
};
