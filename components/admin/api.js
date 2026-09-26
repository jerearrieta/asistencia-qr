// Llama a una API del panel y devuelve { ok, data }
export async function llamarApi(url, method = "GET", body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {}
  return { ok: res.ok, data };
}
