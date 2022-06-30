import { useTheme } from '@curvenote/ui-providers';
import { MoonIcon } from '@heroicons/react/solid';
import { SunIcon } from '@heroicons/react/outline';

export function ThemeButton() {
  const { isDark, nextTheme } = useTheme();
  return (
    <button
      className="theme rounded-full border border-white border-solid mx-3 overflow-hidden text-white hover:text-stone-500 hover:bg-white"
      aria-label={`Change theme to ${isDark ? 'light' : 'dark'} mode.`}
      onClick={nextTheme}
    >
      {isDark ? (
        <MoonIcon className="h-8 w-8 p-1" />
      ) : (
        <SunIcon className="h-8 w-8 p-1" />
      )}
    </button>
  );
}
