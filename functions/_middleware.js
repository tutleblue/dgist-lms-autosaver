// 소개 사이트 주소는 gudaling.dev 하나만 쓴다. daling-app.pages.dev·배포마다 생기는 <해시>.daling-app.pages.dev 로
// 들어오면 같은 경로로 영구 이동시켜, 검색 엔진에 남은 옛 주소(예전 판의 개발자 개인정보가 담긴 사본)가 빠지게 한다.
// 로컬 미리보기(wrangler pages dev, 127.0.0.1·localhost)는 그대로 둔다.
const HOME = "gudaling.dev";

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === HOME || url.hostname === "127.0.0.1" || url.hostname === "localhost") return next();
  return Response.redirect(`https://${HOME}${url.pathname}${url.search}`, 301);
}
