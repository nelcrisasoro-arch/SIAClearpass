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
