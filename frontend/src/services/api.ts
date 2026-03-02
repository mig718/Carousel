import axios from 'axios';

const resolveApiBaseUrl = () => {
  const configuredUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  try {
    const parsedUrl = new URL(configuredUrl);
    const localServicePorts = new Set(['8001', '8002', '8003', '8004', '8005', '8006']);

    if (parsedUrl.hostname === 'localhost' && localServicePorts.has(parsedUrl.port)) {
      parsedUrl.port = '8000';
    }

    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    return configuredUrl;
  }
};

const API_BASE_URL = resolveApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class NotLoggedInError extends Error {
  constructor(message = 'Not logged in') {
    super(message);
    this.name = 'NotLoggedInError';
  }
}

const createRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['X-Request-Id'] = createRequestId();

  return config;
});

const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('email');
  localStorage.removeItem('user');
};

const PUBLIC_PATHS = ['/login', '/register', '/verify', '/pending-approval'];

const redirectToLogin = () => {
  const path = window.location.pathname;
  if (PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath))) {
    return;
  }

  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.href = `/login?redirect=${encodeURIComponent(current)}`;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const errorCode = error?.response?.data?.errorCode;

    if (status === 401 && (errorCode === 'NOT_LOGGED_IN' || !errorCode)) {
      clearAuthStorage();
      redirectToLogin();

      const message = error?.response?.data?.message || 'Not logged in';
      return Promise.reject(new NotLoggedInError(message));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
