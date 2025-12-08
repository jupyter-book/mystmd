#!/usr/bin/env node
/**
 * Script to automatically generate rule-severities.ts by analyzing the codebase.
 *
 * This script searches for usage patterns of RuleId enums in the codebase and determines
 * the default severity based on how they're used with fileError, fileWarn, and addWarningForFile.
 *
 * Usage: node scripts/generate-rule-severities.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageDir = join(__dirname, '..');
const rootDir = join(packageDir, '..', '..');
const packagesDir = join(rootDir, 'packages');

// Patterns to match - note: these work on single-line normalized content
// Using [\s\S] instead of [^)] to handle nested parentheses
// Note: Looking for RuleId.X anywhere in the call to handle cases like: { ruleId: opts?.ruleId ?? RuleId.X }
const patterns = {
  // addWarningForFile with explicit severity - match until we find RuleId
  addWarningWithSeverity: /addWarningForFile\([\s\S]*?RuleId\.(\w+)/gs,
  // fileError with ruleId (look for RuleId anywhere in the call)
  fileError: /fileError\([\s\S]*?RuleId\.(\w+)/gs,
  // fileWarn with ruleId (look for RuleId anywhere in the call)
  fileWarn: /fileWarn\([\s\S]*?RuleId\.(\w+)/gs,
  // errorLogFn or warningLogFn with inline fileError/fileWarn (look for RuleId anywhere)
  inlineErrorLogFn: /errorLogFn:[\s\S]*?fileError\([\s\S]*?RuleId\.(\w+)/gs,
  inlineWarningLogFn: /warningLogFn:[\s\S]*?fileWarn\([\s\S]*?RuleId\.(\w+)/gs,
  // configValidationOpts or similar that create error/warn handlers
  validationOpts: /(?:config|frontmatter|mystJSON)ValidationOpts\([\s\S]*?RuleId\.(\w+)\)/gs,
};

/**
 * Recursively find all TypeScript files in a directory
 */
function findTypeScriptFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and dist directories
      if (entry !== 'node_modules' && entry !== 'dist' && entry !== '.git') {
        findTypeScriptFiles(fullPath, files);
      }
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract rule usages from a file
 */
function extractRuleUsages(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const relativePath = relative(rootDir, filePath);
  const usages = [];

  // Normalize whitespace to handle multi-line patterns better
  content = content.replace(/\s+/g, ' ');

  // Find addWarningForFile with explicit severity
  const addWarningMatches = content.matchAll(patterns.addWarningWithSeverity);
  for (const match of addWarningMatches) {
    const fullMatch = match[0];
    const ruleId = match[1];
    if (!ruleId) continue;

    // Look for 'error' or 'warn' in the call before the ruleId
    // Extract just the part before ruleId to avoid false matches in error messages
    const beforeRuleId = fullMatch.substring(0, fullMatch.indexOf('ruleId:'));

    let severity = 'warn';
    // Match the severity parameter (3rd parameter after session and file)
    // Look for patterns like: ..., 'error', { or ..., "error", {
    const errorMatch = beforeRuleId.match(/,\s*['"]error['"]\s*,/);
    if (errorMatch) {
      severity = 'error';
    }

    usages.push({
      ruleId,
      severity,
      file: relativePath,
      pattern: 'addWarningForFile',
    });
  }

  // Find fileError calls
  const errorMatches = content.matchAll(patterns.fileError);
  for (const match of errorMatches) {
    const ruleId = match[1];
    if (ruleId) {
      usages.push({
        ruleId,
        severity: 'error',
        file: relativePath,
        pattern: 'fileError',
      });
    }
  }

  // Find fileWarn calls
  const warnMatches = content.matchAll(patterns.fileWarn);
  for (const match of warnMatches) {
    const ruleId = match[1];
    if (ruleId) {
      usages.push({
        ruleId,
        severity: 'warn',
        file: relativePath,
        pattern: 'fileWarn',
      });
    }
  }

  // Find inline errorLogFn with fileError
  const inlineErrorMatches = content.matchAll(patterns.inlineErrorLogFn);
  for (const match of inlineErrorMatches) {
    const ruleId = match[1];
    if (ruleId) {
      usages.push({
        ruleId,
        severity: 'error',
        file: relativePath,
        pattern: 'errorLogFn',
      });
    }
  }

  // Find inline warningLogFn with fileWarn
  const inlineWarnMatches = content.matchAll(patterns.inlineWarningLogFn);
  for (const match of inlineWarnMatches) {
    const ruleId = match[1];
    if (ruleId) {
      usages.push({
        ruleId,
        severity: 'warn',
        file: relativePath,
        pattern: 'warningLogFn',
      });
    }
  }

  // Find validation opts (these use both error and warn, but we'll mark as error priority)
  const validationMatches = content.matchAll(patterns.validationOpts);
  for (const match of validationMatches) {
    const ruleId = match[1];
    if (ruleId) {
      usages.push({
        ruleId,
        severity: 'error', // Validation opts use both, but errors are more critical
        file: relativePath,
        pattern: 'validationOpts',
      });
    }
  }

  return usages;
}

/**
 * Aggregate rule usages to determine default severity
 */
function aggregateRuleUsages(allUsages) {
  const ruleMap = new Map();

  for (const usage of allUsages) {
    if (!ruleMap.has(usage.ruleId)) {
      ruleMap.set(usage.ruleId, {
        errorCount: 0,
        warnCount: 0,
        files: new Set(),
        patterns: new Set(),
      });
    }

    const rule = ruleMap.get(usage.ruleId);
    if (usage.severity === 'error') {
      rule.errorCount++;
    } else {
      rule.warnCount++;
    }
    rule.files.add(usage.file);
    rule.patterns.add(usage.pattern);
  }

  // Determine default severity for each rule
  const ruleSeverities = new Map();
  for (const [ruleId, stats] of ruleMap.entries()) {
    // If a rule is ever used as an error, default to error
    // Otherwise default to warn
    const severity = stats.errorCount > 0 ? 'error' : 'warn';

    // Create a comment explaining the usage
    const fileList = Array.from(stats.files).slice(0, 3); // Show up to 3 files
    const moreFiles = stats.files.size > 3 ? ` and ${stats.files.size - 3} more` : '';
    const patternList = Array.from(stats.patterns).join(', ');

    let comment = `${patternList} in ${fileList.join(', ')}${moreFiles}`;
    if (stats.errorCount > 0 && stats.warnCount > 0) {
      comment = `Uses both error (${stats.errorCount}×) and warn (${stats.warnCount}×); ${comment}`;
    }

    ruleSeverities.set(ruleId, { severity, comment });
  }

  return ruleSeverities;
}

/**
 * Load all RuleId values from the enum
 */
function loadRuleIds() {
  const ruleidsPath = join(packagesDir, 'myst-common', 'src', 'ruleids.ts');
  const content = readFileSync(ruleidsPath, 'utf-8');

  // Extract rule IDs from the enum
  const enumMatch = content.match(/export enum RuleId \{([^}]+)\}/s);
  if (!enumMatch) {
    throw new Error('Could not find RuleId enum');
  }

  const enumBody = enumMatch[1];
  const ruleIds = [];

  // Match: ruleName = 'rule-name',
  const rulePattern = /(\w+)\s*=\s*['"][\w-]+['"]/g;
  let match;
  while ((match = rulePattern.exec(enumBody)) !== null) {
    ruleIds.push(match[1]);
  }

  return ruleIds;
}

/**
 * Group rules by category based on comments in the enum
 */
function getRuleCategories() {
  const ruleidsPath = join(packagesDir, 'myst-common', 'src', 'ruleids.ts');
  const content = readFileSync(ruleidsPath, 'utf-8');

  const categories = [];
  let currentCategory = null;
  let currentRules = [];

  const lines = content.split('\n');
  const enumStart = lines.findIndex((line) => line.includes('export enum RuleId'));
  const enumEnd = lines.findIndex((line, i) => i > enumStart && line.trim() === '}');

  for (let i = enumStart + 1; i < enumEnd; i++) {
    const line = lines[i].trim();

    // Check for category comment
    if (line.startsWith('// ') && line.endsWith('rules')) {
      if (currentCategory) {
        categories.push({ name: currentCategory, rules: currentRules });
      }
      currentCategory = line.substring(3); // Remove '// '
      currentRules = [];
    } else if (line.match(/(\w+)\s*=/)) {
      const match = line.match(/(\w+)\s*=/);
      if (match && currentCategory) {
        currentRules.push(match[1]);
      }
    }
  }

  if (currentCategory) {
    categories.push({ name: currentCategory, rules: currentRules });
  }

  return categories;
}

/**
 * Generate the rule-severities.ts file
 */
function generateFile(ruleSeverities, categories) {
  let output = `// ******************************************************
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
`;

  for (const category of categories) {
    output += `  // ${category.name}\n`;

    for (const ruleId of category.rules) {
      const info = ruleSeverities.get(ruleId);

      if (info) {
        const comment =
          info.comment.length > 100 ? info.comment.substring(0, 97) + '...' : info.comment;
        output += `  [RuleId.${ruleId}]: '${info.severity}', // ${comment}\n`;
      } else {
        // Rule not found in codebase - mark as warn with a note
        output += `  [RuleId.${ruleId}]: 'warn', // NOT FOUND in codebase analysis\n`;
      }
    }
  }

  output += `};
`;

  return output;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Searching for TypeScript files...');
  const files = findTypeScriptFiles(packagesDir);
  console.log(`   Found ${files.length} TypeScript files`);

  console.log('📊 Analyzing rule usage patterns...');
  const allUsages = [];
  for (const file of files) {
    const usages = extractRuleUsages(file);
    allUsages.push(...usages);
  }
  console.log(`   Found ${allUsages.length} rule usages`);

  console.log('🔄 Aggregating rule severities...');
  const ruleSeverities = aggregateRuleUsages(allUsages);
  console.log(`   Analyzed ${ruleSeverities.size} unique rules`);

  console.log('📚 Loading rule definitions...');
  const allRuleIds = loadRuleIds();
  const categories = getRuleCategories();
  console.log(`   Found ${allRuleIds.length} rule definitions in ${categories.length} categories`);

  // Check for missing rules
  const foundRuleIds = new Set(ruleSeverities.keys());
  const missingRules = allRuleIds.filter((id) => !foundRuleIds.has(id));
  if (missingRules.length > 0) {
    console.warn(`⚠️  Warning: ${missingRules.length} rules not found in codebase:`);
    for (const ruleId of missingRules) {
      console.warn(`   - ${ruleId}`);
    }
  }

  console.log('✍️  Generating rule-severities.ts...');
  const output = generateFile(ruleSeverities, categories);

  const outputPath = join(packageDir, 'src', 'rule-severities.ts');
  writeFileSync(outputPath, output, 'utf-8');

  console.log(`✅ Successfully generated ${outputPath}`);
  console.log(`
📈 Statistics:
   - Total rules: ${allRuleIds.length}
   - Rules with 'error' default: ${Array.from(ruleSeverities.values()).filter((r) => r.severity === 'error').length}
   - Rules with 'warn' default: ${Array.from(ruleSeverities.values()).filter((r) => r.severity === 'warn').length}
   - Rules not found: ${missingRules.length}
`);
}

main();
