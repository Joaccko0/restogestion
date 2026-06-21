import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { MeService } from '../services/me.service';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, Loader2 } from 'lucide-react';

export default function AdminLayout() {
    const { logout } = useAuth();
    const [gate, setGate] = useState<'loading' | 'ok' | 'deny'>('loading');
    const [email, setEmail] = useState('');

    useEffect(() => {
        MeService.getSession()
            .then((s) => {
                if (s.superAdmin) {
                    setEmail(s.email);
                    setGate('ok');
                } else {
                    setGate('deny');
                }
            })
            .catch(() => setGate('deny'));
    }, []);

    if (gate === 'loading') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p className="text-slate-400 text-sm">Verificando acceso de administrador...</p>
            </div>
        );
    }

    if (gate === 'deny') {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950 text-white shadow-lg">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/25">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold leading-tight tracking-tight">
                                RestoGestión Admin
                            </p>
                            <p className="text-xs text-slate-400">Panel SuperAdmin</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <p className="text-xs text-slate-500">Sesión activa</p>
                            <p className="text-sm font-medium text-slate-200">{email}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-300 hover:bg-slate-800 hover:text-white"
                            onClick={logout}
                        >
                            <LogOut className="h-4 w-4 mr-1.5" />
                            Salir
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
                <Outlet />
            </main>
        </div>
    );
}
