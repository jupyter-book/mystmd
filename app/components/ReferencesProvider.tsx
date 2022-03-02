import { GenericNode } from 'mystjs';
import React, { useContext } from 'react';

export type Citations = {
  order: string[];
  data: Record<string, { html: string; number: number }>;
};

export type Footnotes = Record<string, GenericNode>;

export type References = {
  cite: Citations;
  footnotes: Footnotes;
};

const ReferencesContext = React.createContext<References | null>(null);

export function ReferencesProvider({
  references,
  children,
}: {
  references: References;
  children: React.ReactNode;
}) {
  return (
    <ReferencesContext.Provider value={references}>
      {children}
    </ReferencesContext.Provider>
  );
}

export function useReferences() {
  const references = useContext(ReferencesContext);
  return references;
}
