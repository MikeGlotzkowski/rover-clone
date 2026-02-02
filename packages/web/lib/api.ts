const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: string;
  body?: any;
  token?: string;
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data;
}

// Auth
export const authApi = {
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api<{ user: any; token: string }>('/auth/register', { method: 'POST', body: data }),
  
  login: (data: { email: string; password: string }) =>
    api<{ user: any; token: string }>('/auth/login', { method: 'POST', body: data }),
  
  me: (token: string) =>
    api<any>('/auth/me', { token }),
};

// Providers
export const providersApi = {
  search: (params: { location?: string; service?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api<any[]>(`/providers/search?${query}`);
  },
  
  get: (id: string) =>
    api<any>(`/providers/${id}`),
};

// Bookings
export const bookingsApi = {
  create: (data: any, token: string) =>
    api<any>('/bookings', { method: 'POST', body: data, token }),
  
  list: (token: string, role?: string) =>
    api<any[]>(`/bookings${role ? `?role=${role}` : ''}`, { token }),
  
  updateStatus: (id: string, status: string, token: string) =>
    api<any>(`/bookings/${id}/status`, { method: 'PUT', body: { status }, token }),
};
