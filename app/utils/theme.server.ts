import { createCookieSessionStorage } from '@remix-run/node';
import { isTheme, Theme } from '~/components';

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
    commit: () =>
      themeStorage.commitSession(session, { expires: new Date('2100-01-01') }),
  };
}

export { getThemeSession };
