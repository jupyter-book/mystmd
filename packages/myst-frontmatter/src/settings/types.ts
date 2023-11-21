type OutputRemovalOptions = 'show' | 'remove' | 'remove-warn' | 'remove-error' | 'warn' | 'error';

export type MystToTexSettings = {
  codeStyle?: 'verbatim' | 'minted' | 'listings';
  printGlossaries?: boolean;
};

export type ProjectSettings = {
  output_stderr?: OutputRemovalOptions;
  output_stdout?: OutputRemovalOptions;
  output_matplotlib_strings?: OutputRemovalOptions;
  myst_to_tex?: MystToTexSettings;
};
