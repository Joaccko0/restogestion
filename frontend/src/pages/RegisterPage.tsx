import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, User } from "lucide-react";

export default function RegisterPage() {
    // Objeto único para todos los campos del formulario (mejor que múltiples useState)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });

    // Feedback al usuario
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Hook para registrar; hook para navegar tras éxito
    const { register } = useAuth();
    const navigate = useNavigate();

    // Actualiza formData por campo y limpia validación nativa
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        // Actualiza solo el campo editado, mantiene los otros igual (spread operator)
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
        // Limpia mensaje de error nativo del navegador al escribir
        e.target.setCustomValidity('');
    };

    // Maneja envío del formulario: intenta registro y navega o muestra error
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Limpia error anterior
        setIsLoading(true);
        
        try {
            // Llama register del contexto (crea usuario y guarda JWT)
            await register(formData);
            // Si no lanzó error, el JWT fue guardado; navega al dashboard
            navigate('/dashboard');
        } catch (err) {
            // Si falla (email duplicado, datos inválidos, servidor offline, etc.)
            setError('Error al registrar. Verifica los datos o intenta con otro correo.');
        } finally {
            setIsLoading(false);
        }
    };

return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#F2EDE4] to-[#E5D9D1] p-8">
            <div className="mx-auto w-full max-w-[500px] space-y-8 bg-white rounded-2xl shadow-2xl p-8">
                
                {/* Título y descripción */}
                <div className="flex flex-col space-y-2 text-center">
                    <div className="flex justify-center mb-2">
                        <img
                            src="/restogestion-logo.png"
                            alt="RestoGestion"
                            className="h-20 w-auto object-contain"
                        />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Crea tu cuenta</h1>
                    <p className="text-sm text-muted-foreground">
                        Únete a RestoGestion.
                    </p>
                </div>
                
                {/* Muestra error si registro falló */}
                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md font-medium animate-in fade-in-50">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Nombre y Apellido en dos columnas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Nombre</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    id="firstName" 
                                    type="text" 
                                    placeholder="Juan" 
                                    className="pl-10 h-11"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Apellido</Label>
                            <Input 
                                id="lastName" 
                                type="text" 
                                placeholder="Pérez" 
                                className="h-11"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Email: único en el backend */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="nombre@ejemplo.com" 
                                className="pl-10 h-11"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Contraseña: mínimo 6 caracteres */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="password" 
                                type="password" 
                                className="pl-10 h-11"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Botón: deshabilita y muestra spinner durante registro */}
                    <Button 
                        className="w-full h-11 font-bold text-base bg-[#F24452] hover:bg-[#F23D3D] text-white mt-4" 
                        type="submit" 
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Registrando...
                            </>
                        ) : (
                            'Registrarse'
                        )}
                    </Button>
                </form>

                {/* Link a login para usuarios existentes */}
                <div className="text-center text-sm">
                    <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
                    <Link to="/login" className="font-medium text-primary hover:underline underline-offset-4">
                        Inicia sesión aquí
                    </Link>
                </div>
              
            </div>
        </div>
    );
}