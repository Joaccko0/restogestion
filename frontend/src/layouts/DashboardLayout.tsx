import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { MeService } from '../services/me.service';
import { 
    LayoutDashboard, 
    Pizza, 
    Users, 
    LogOut, 
    Menu, 
    X,
    DollarSign,
    History,
    BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { currentBusiness } = useBusiness();
    const location = useLocation(); // Para saber en qué ruta estamos y pintarla de color
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        MeService.getSession()
            .then((s) => {
                if (s.superAdmin) {
                    navigate('/admin', { replace: true });
                }
            })
            .catch(() => {});
    }, [navigate]);

    useEffect(() => {
        if (!currentBusiness || currentBusiness.billingStatus !== 'VENCIDO') {
            return;
        }
        if (!location.pathname.startsWith('/dashboard/stats')) {
            navigate('/dashboard/stats', { replace: true });
        }
    }, [currentBusiness, location.pathname, navigate]);

    const vencido = currentBusiness?.billingStatus === 'VENCIDO';

    // Definimos las opciones del menú (solo estadísticas si suscripción vencida)
    const fullMenu = [
        { label: 'Panel Principal', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Historial de Pedidos', icon: History, path: '/dashboard/history' },
        { label: 'Estadísticas', icon: BarChart3, path: '/dashboard/stats' },
        { label: 'Productos', icon: Pizza, path: '/dashboard/products' },
        { label: 'Clientes', icon: Users, path: '/dashboard/customers' },
        { label: 'Gastos', icon: DollarSign, path: '/dashboard/expenses' },
    ];
    const menuItems = vencido
        ? fullMenu.filter((i) => i.path === '/dashboard/stats')
        : fullMenu;

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900">
            
            {/* --- SIDEBAR (Escritorio) --- */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
                
                {/* Logo del Negocio */}
                <div className="px-4 py-6 border-b border-gray-100">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <img
                            src="/restogestion-logo.png"
                            alt="RestoGestion"
                            className="h-32 w-full max-w-[220px] object-contain"
                        />
                        <span className="font-semibold text-base text-gray-800 w-full leading-snug">
                            {currentBusiness?.name || 'Cargando...'}
                        </span>
                    </div>
                </div>

                {/* Navegación */}
                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                    isActive 
                                    ? 'bg-orange-50 text-orange-600' 
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Sidebar */}
                <div className="p-4 border-t border-gray-100">
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={logout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Header Móvil (Solo visible en celular) */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white border-b shadow-sm">
                    <img
                        src="/restogestion-logo.png"
                        alt="RestoGestion"
                        className="h-8 w-auto object-contain"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </Button>
                </header>

                {/* Menú Móvil Desplegable */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b shadow-lg z-50 p-4 flex flex-col gap-2">
                        {menuItems.map((item) => (
                            <Link 
                                key={item.path} 
                                to={item.path} 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-3 hover:bg-gray-50 rounded-md flex gap-2"
                            >
                                <item.icon className="w-5 h-5" /> {item.label}
                            </Link>
                        ))}
                         <Button variant="destructive" onClick={logout} className="mt-2">Salir</Button>
                    </div>
                )}

                {/* ÁREA DE CONTENIDO (Aquí se renderizan las páginas) */}
                <main className="flex-1 overflow-y-auto p-8">
                    {currentBusiness?.billingStatus === 'VENCIDO' && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            Suscripción vencida. Solo puedes consultar estadísticas.
                        </div>
                    )}
                    {currentBusiness?.warningExpirySoon &&
                        currentBusiness.billingStatus === 'VIGENTE' && (
                            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                Tu suscripción vence en menos de 5 días
                                {currentBusiness.expiresAt
                                    ? ` (fecha fin: ${currentBusiness.expiresAt})`
                                    : ''}
                                .
                            </div>
                        )}
                    {currentBusiness?.billingStatus === 'MOROSO' && (
                        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                            Período de mora: te quedan {currentBusiness.morosoGraceDaysLeft} días de gracia antes
                            del corte del servicio.
                        </div>
                    )}
                    <Outlet /> {/* <-- AQUÍ VA LO QUE CAMBIA (Productos, Dashboard, etc) */}
                </main>
            </div>
        </div>
    );
}