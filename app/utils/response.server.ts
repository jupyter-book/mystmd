export function responseNoSite(data: string): Response {
  // note: error boundary logic is dependent on the string sent here
  return new Response(data, {
    status: 404,
    statusText: 'Site was not found',
  });
}

export function responseNoArticle() {
  // note: error boundary logic is dependent on the string sent here
  return new Response('Article was not found', {
    status: 404,
    statusText: 'Article was not found',
  });
}
