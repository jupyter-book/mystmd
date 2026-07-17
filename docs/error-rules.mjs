import { RuleId, RULE_ID_DESCRIPTIONS, RULE_DEFAULT_SEVERITY } from 'myst-common';

const errorRulesDirective = {
  name: 'myst:error-rules-list',
  run() {
    // Get all rule IDs and their descriptions
    const rules = Object.values(RuleId).flatMap((ruleId) => {
      const severity = RULE_DEFAULT_SEVERITY[ruleId];
      const severityBadge = {
        type: 'emphasis',
        children: [{ type: 'text', value: `[${severity}]` }],
      };

      return [
        {
          type: 'definitionTerm',
          children: [
            { type: 'inlineCode', value: ruleId },
            { type: 'text', value: ' ' },
            severityBadge,
          ],
        },
        {
          type: 'definitionDescription',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: RULE_ID_DESCRIPTIONS[ruleId] }],
            },
          ],
        },
      ];
    });

    return [
      {
        type: 'definitionList',
        children: rules,
      },
    ];
  },
};

const plugin = { name: 'Error Rules List', directives: [errorRulesDirective] };

export default plugin;
