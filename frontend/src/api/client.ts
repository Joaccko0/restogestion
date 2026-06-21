import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosInstance } from 'axios';

const apiBase =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
    'http://localhost:8080/api';

const client: AxiosInstance = axios.create({
    baseURL: apiBase,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- INTERCEPTOR DE REQUEST: Añade el JWT a cada solicitud ---
client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const url = String(config.url ?? '');
        const isPublicAuth = url.includes('/auth/login') || url.includes('/auth/register');
        const token = localStorage.getItem('jwt_token');
        if (token && !isPublicAuth) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// --- INTERCEPTOR DE RESPONSE: Maneja 401 y refresh token ---
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Si el servidor retorna 401, el token probablemente expiró
        if (error.response?.status === 401) {
            const url = String(error.config?.url ?? '');
            // No redirigir en fallo de login/register (401 = credenciales malas)
            if (url.includes('/auth/login') || url.includes('/auth/register')) {
                return Promise.reject(error);
            }
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default client;