import type { ActionFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { isTheme, Theme } from '~/components';
import { getThemeSession } from '~/utils/theme.server';

export const action: ActionFunction = async ({ request }) => {
  const themeSession = await getThemeSession(request);
  const data = await request.json();
  const { theme } = data ?? {};
  if (!isTheme(theme))
    return json({
      success: false,
      message: `Invalid theme: "${theme}".`,
    });

  themeSession.setTheme(theme as Theme);
  return json(
    { success: true, theme },
    {
      headers: { 'Set-Cookie': await themeSession.commit() },
    },
  );
};

export const loader = () => redirect('/', { status: 404 });
