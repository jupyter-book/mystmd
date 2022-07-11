export enum ErrorStatus {
  noSite = 'Site was not found',
  noArticle = 'Article was not found',
}

export function responseNoSite(): Response {
  // note: error boundary logic is dependent on the string sent here
  return new Response(ErrorStatus.noSite, {
    status: 404,
    statusText: ErrorStatus.noSite,
  });
}

export function responseNoArticle() {
  // note: error boundary logic is dependent on the string sent here
  return new Response(ErrorStatus.noArticle, {
    status: 404,
    statusText: ErrorStatus.noArticle,
  });
}
