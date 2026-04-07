import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://vitgqdlredogyfuodnfy.supabase.co/functions/v1';

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('auth_token');
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  console.log(`[API] ${options.method || 'GET'} ${path}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    let errMsg = 'Request failed';
    try {
      const json = JSON.parse(text);
      errMsg = json.error || json.message || errMsg;
    } catch {
      errMsg = text || errMsg;
    }
    console.log(`[API] Error ${res.status} ${path}: ${errMsg}`);
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body: unknown) =>
    apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body: unknown) =>
    apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path: string, body: unknown) =>
    apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: 'DELETE' }),
  setToken: (token: string) => AsyncStorage.setItem('auth_token', token),
  clearToken: () => AsyncStorage.removeItem('auth_token'),
};
