import { createCookieSessionStorage, json } from '@remix-run/node';
import { isTheme, Theme } from '@curvenote/ui-providers';
import type { ActionFunction } from '@remix-run/node';

export const themeStorage = createCookieSessionStorage({
  cookie: {
    name: 'theme',
    secure: true,
    secrets: ['secret'],
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
  },
});

async function getThemeSession(request: Request) {
  const session = await themeStorage.getSession(request.headers.get('Cookie'));
  return {
    getTheme: () => {
      const themeValue = session.get('theme');
      return isTheme(themeValue) ? themeValue : Theme.light;
    },
    setTheme: (theme: Theme) => session.set('theme', theme),
    commit: () => themeStorage.commitSession(session, { expires: new Date('2100-01-01') }),
  };
}

export { getThemeSession };

export const setThemeAPI: ActionFunction = async ({ request }) => {
  const themeSession = await getThemeSession(request);
  const data = await request.json();
  const { theme } = data ?? {};
  if (!isTheme(theme)) {
    return json({
      success: false,
      message: `Invalid theme: "${theme}".`,
    });
  }
  themeSession.setTheme(theme as Theme);
  return json(
    { success: true, theme },
    {
      headers: { 'Set-Cookie': await themeSession.commit() },
    },
  );
};
