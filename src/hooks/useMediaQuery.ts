import { useState, useEffect } from 'react';

/**
 * Hook reactivo para detección de media queries.
 * Reemplaza el uso de window.innerWidth que no es reactivo.
 *
 * @param query - Media query string, ej: '(max-width: 1023px)'
 * @returns boolean - true si la media query aplica actualmente
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 1023px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Usar addEventListener si está disponible (moderno), addListener como fallback
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
      return () => mediaQueryList.removeEventListener('change', listener);
    } else {
      // Fallback para Safari < 14
      mediaQueryList.addListener(listener);
      return () => mediaQueryList.removeListener(listener);
    }
  }, [query]);

  return matches;
}
