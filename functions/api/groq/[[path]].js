// Cloudflare Pages Function: proxy /api/groq/* → api.groq.com with the
// server-side key, mirroring the Vite dev proxy so the browser never sees keys.
export async function onRequest(context) {
  const { request, env, params } = context;
  const sub = Array.isArray(params.path) ? params.path.join("/") : (params.path || "");
  const url = new URL(request.url);
  const target = `https://api.groq.com/${sub}${url.search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  if (env.GROQ_API_KEY) headers.set("Authorization", `Bearer ${env.GROQ_API_KEY}`);
  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : request.body;
  return fetch(target, { method, headers, body, redirect: "follow" });
}
