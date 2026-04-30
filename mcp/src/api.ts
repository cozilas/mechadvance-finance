const BASE_URL = process.env.FINANCE_API_URL ?? 'http://localhost:8000/api';

async function request(method: string, path: string, body?: unknown): Promise<unknown> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

export const api = {
  get: (path: string, params?: Record<string, string | number | undefined>) => {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return request('GET', path + qs);
  },
  post:   (path: string, body: unknown) => request('POST',   path, body),
  put:    (path: string, body: unknown) => request('PUT',    path, body),
  patch:  (path: string, body: unknown) => request('PATCH',  path, body),
  delete: (path: string)                => request('DELETE', path),
};
