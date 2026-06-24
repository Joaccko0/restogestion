import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MeService } from '../services/me.service';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock } from "lucide-react";
export default function LoginPage() {
    // Campos del formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Feedback al usuario
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Hook para autenticar; hook para navegar tras éxito
    const { login } = useAuth();
    const navigate = useNavigate();

    // Valida sobre el email ya sin espacios al inicio/fin (evita fallos HTML5 por espacio “fantasma” al pegar/autocompletar)
    const isValidEmailShape = (value: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    const handleEmailValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
        const trimmed = e.target.value.trim();
        setEmail(trimmed);
        if (!trimmed) {
            e.target.setCustomValidity('Por favor ingresa un correo electrónico.');
        } else if (!isValidEmailShape(trimmed)) {
            e.target.setCustomValidity('Por favor ingresa un correo electrónico válido.');
        } else {
            e.target.setCustomValidity('');
        }
    };

    // Valida password en tiempo real
    const handlePasswordValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
        const passwordInput = e.target;
        if (!passwordInput.validity.valid && passwordInput.validity.valueMissing) {
            passwordInput.setCustomValidity('Por favor ingresa tu contraseña.');
        } else {
            passwordInput.setCustomValidity('');
        }
        setPassword(passwordInput.value);
    };

    // Maneja el envío del formulario: intenta login y navega o muestra error
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Limpia error anterior
        const emailClean = email.trim();
        if (!emailClean) {
            setError('Por favor ingresa un correo electrónico.');
            return;
        }
        if (!isValidEmailShape(emailClean)) {
            setError('Por favor ingresa un correo electrónico válido.');
            return;
        }
        if (!password) {
            setError('Por favor ingresa tu contraseña.');
            return;
        }
        setIsLoading(true);
        
        try {
            // Llama login del contexto (comunicación con backend)
            await login({ email: emailClean, password });
            const session = await MeService.getSession();
            navigate(session.superAdmin ? '/admin' : '/dashboard');
        } catch (err) {
            // Si falla (credenciales inválidas, servidor offline, etc.)
            setError('Credenciales inválidas. Verifica tus datos.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#F2EDE4] to-[#E5D9D1] p-4 sm:p-8">
            <div className="mx-auto w-full max-w-[420px] space-y-6 sm:space-y-8 bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-white/80 p-5 sm:p-8">
                
                {/* Título y descripción */}
                <div className="flex flex-col space-y-2 text-center">
                    <div className="flex justify-center mb-2 sm:mb-4">
                        <img
                            src="/restogestion-logo.png"
                            alt="RestoGestion"
                            className="h-16 sm:h-20 w-auto object-contain"
                        />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bienvenido de nuevo</h1>
                    <p className="text-sm text-muted-foreground px-2">
                        Ingresa tus credenciales para acceder al panel.
                    </p>
                </div>

                {/* Muestra error si login falló */}
                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md font-medium animate-in fade-in-50">
                        {error}
                    </div>
                )}

                {/* Campos de email y contraseña */}
                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" noValidate>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="nombre@ejemplo.com" 
                                    className="pl-10 h-12 text-base"
                                    value={email}
                                    onChange={handleEmailValidation}
                                    required
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Contraseña</Label>
                                <a href="#" className="text-sm font-medium text-primary hover:underline underline-offset-4 text-muted-foreground">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password" 
                                    type="password" 
                                    className="pl-10 h-12 text-base"
                                    value={password}
                                    onChange={handlePasswordValidation}
                                    required
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botón: deshabilita y muestra spinner durante login */}
                    <Button 
                        className="w-full h-12 font-bold text-base bg-[#F24452] hover:bg-[#F23D3D] active:bg-[#E03333] text-white transition-all duration-200 shadow-md disabled:opacity-70 disabled:cursor-not-allowed" 
                        type="submit" 
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Autenticando...
                            </>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </Button>
                </form>

            </div>
        </div>
    );
}