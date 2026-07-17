# MyST Scripts

This directory contains utility scripts for maintaining the MyST codebase.

## generate-rule-severities.mjs

Automatically generates `packages/myst-common/src/rule-severities.ts` by analyzing the codebase for rule usage patterns.

### What it does

The script:

1. Scans all TypeScript files in the `packages` directory
2. Searches for patterns like:
   - `fileError(..., { ruleId: RuleId.* })` → **error** severity
   - `fileWarn(..., { ruleId: RuleId.* })` → **warn** severity
   - `addWarningForFile(..., 'error', { ruleId: RuleId.* })` → **error** severity
   - `addWarningForFile(..., 'warn', { ruleId: RuleId.* })` → **warn** severity
   - `*ValidationOpts(..., RuleId.*)` → **error** severity (uses both, but errors are critical)
3. Aggregates the severities for each rule
4. Generates the `rule-severities.ts` file with:
   - Default severity for each rule
   - Comments explaining where each rule is used
   - Proper categorization matching the RuleId enum

### Usage

```bash
# From the repository root
node scripts/generate-rule-severities.mjs
```
