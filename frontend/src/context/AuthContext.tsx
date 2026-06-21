import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import type { ReactNode } from 'react';
import type { LoginRequest, AuthResponse, RegisterRequest } from '../types/auth.types';

// Define la forma del contexto y qué métodos/datos expone a los componentes
interface AuthContextType {
    token: string | null; // JWT actual (null si no autenticado)
    isAuthenticated: boolean; // Conveniencia: true si hay token
    login: (data: LoginRequest) => Promise<void>; // Autentica usuario
    logout: () => void; // Limpia sesión
    register: (data: RegisterRequest) => Promise<void>; // Registra nuevo usuario
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // Recupera JWT de localStorage si existe (permite mantener sesión tras F5)
    const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));

    // Registra un nuevo usuario: envía datos al backend y guarda el JWT retornado
    const register = async (data: RegisterRequest) => {
        try {
            const response = await client.post<AuthResponse>('/auth/register', data);
            const newToken = response.data.token;
            localStorage.setItem('jwt_token', newToken);
            setToken(newToken);
        } catch (error) {
            console.error("Error en registro:", error);
            throw error;
        }
    };

    // Efecto: Mantiene localStorage sincronizado con el estado del token
    // Si token existe, lo guarda; si no, lo elimina (limpieza en logout)
    useEffect(() => {
        if (token) {
            localStorage.setItem('jwt_token', token);
        } else {
            localStorage.removeItem('jwt_token');
        }
    }, [token]);

    // Autentica usuario: envía credenciales y guarda JWT si son válidas
    const login = async (credentials: LoginRequest) => {
        try {
            const response = await client.post<AuthResponse>('/auth/login', credentials);
            const newToken = response.data.token;
            // Sincronizar de inmediato: el interceptor de Axios lee localStorage, no el state de React
            localStorage.setItem('jwt_token', newToken);
            setToken(newToken);
        } catch (error) {
            console.error("Error en login:", error);
            throw error;
        }
    };

    // Cierra sesión: limpia el token (que a su vez limpia localStorage por el useEffect)
    const logout = () => {
        setToken(null);
    };

    // Proporciona datos y funciones a componentes descendientes
    return (
        <AuthContext.Provider value={{ 
            token, 
            isAuthenticated: !!token, // Conversión a boolean: null → false, token → true
            login, 
            logout,
            register
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook para acceder al contexto Auth en cualquier componente (dentro de AuthProvider)
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};