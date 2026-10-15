type ApiRuntime = typeof globalThis & {
  __CLEARPASS_API_BASE_URL__?: string;
};

const getApiBaseUrl = () => {
  const configuredUrl = (globalThis as ApiRuntime).__CLEARPASS_API_BASE_URL__?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');
  if (typeof window === 'undefined') return 'http://10.0.2.2:3000';
  return '';
};

export const apiUrl = (path: string) => `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

export const getSessionToken = () => {
  try { return localStorage.getItem('sia_clearpass_session'); } catch { return null; }
};

export const apiFetch = (path: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);
  const token = getSessionToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(apiUrl(path), { ...init, headers });
};

export const realtimeUrl = () => {
  const token = getSessionToken();
  const url = apiUrl('/api/realtime/stream');
  return token ? `${url}?ticket=${encodeURIComponent(token)}` : url;
};
