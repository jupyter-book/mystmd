import { useTransition } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';

export function useNavigationHeight<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeightState] = useState(1000);
  const transitionState = useTransition().state;
  const setHeight = () => {
    if (ref.current) {
      setHeightState(ref.current.offsetHeight - window.scrollY);
    }
  };
  useEffect(() => {
    setHeight();
    setTimeout(setHeight, 100); // Some lag sometimes
    const handleScroll = () => setHeight();
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [ref, transitionState]);
  return { ref, height };
}
