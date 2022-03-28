import { useEffect, useState } from 'react';

// Based on https://usehooks-ts.com/react-hook/use-media-query
export function useMediaQuery(query: string): boolean {
  const ssr = typeof window === 'undefined';
  const getMatches = (query: string): boolean => {
    if (ssr) return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  function handleChange() {
    setMatches(getMatches(query));
  }

  useEffect(() => {
    if (ssr) return;
    const matchMedia = window.matchMedia(query);
    // Triggered at the first client-side load and if query changes
    handleChange();
    // Listen matchMedia
    matchMedia.addEventListener('change', handleChange);
    return () => {
      matchMedia.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
