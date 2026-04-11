import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { MeService } from '../services/me.service';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Shield } from 'lucide-react';

export default function AdminLayout() {
    const { logout } = useAuth();
    const [gate, setGate] = useState<'loading' | 'ok' | 'deny'>('loading');

    useEffect(() => {
        MeService.getSession()
            .then((s) => setGate(s.superAdmin ? 'ok' : 'deny'))
            .catch(() => setGate('deny'));
    }, []);

    if (gate === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">Cargando panel de administración...</p>
            </div>
        );
    }
    if (gate === 'deny') {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-lg">
                    <Shield className="h-6 w-6 text-orange-600" />
                    Administración
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="text-red-600" onClick={logout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Salir
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
                <Outlet />
            </main>
        </div>
    );
}
