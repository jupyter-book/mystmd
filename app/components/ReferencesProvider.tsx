import React, { useContext } from 'react';
import { References } from '~/utils';

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
