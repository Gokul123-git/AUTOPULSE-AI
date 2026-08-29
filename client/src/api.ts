import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('autopulse-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

let refreshRequest: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const refreshToken = localStorage.getItem('autopulse-refresh-token');
    if (error.response?.status !== 401 || original?._retried || !refreshToken || original?.url?.includes('/auth/refresh')) return Promise.reject(error);
    original._retried = true;
    try {
      if (!refreshRequest) refreshRequest = axios.post('/api/auth/refresh', { refreshToken }).then(({ data }) => {
        localStorage.setItem('autopulse-token', data.token);
        localStorage.setItem('autopulse-refresh-token', data.refreshToken);
        localStorage.setItem('autopulse-user', JSON.stringify(data.user));
        return data.token as string;
      }).finally(() => { refreshRequest = null; });
      const token = await refreshRequest;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      localStorage.removeItem('autopulse-token');
      localStorage.removeItem('autopulse-refresh-token');
      localStorage.removeItem('autopulse-user');
      return Promise.reject(refreshError);
    }
  }
);
