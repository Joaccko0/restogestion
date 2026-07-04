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
    const { currentBusiness, isLoading } = useBusiness();
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

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

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

    const mobileQuickNav = menuItems.slice(0, 5);

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[#F8F4EF] text-gray-900">
            
            {/* --- SIDEBAR (Escritorio) --- */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E5D9D1] shadow-sm">
                
                {/* Logo del Negocio */}
                <div className="px-4 py-6 border-b border-[#F2EDE4]">
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
                                        ? 'bg-[#F24452]/10 text-[#F24452]'
                                        : 'text-gray-600 hover:bg-[#F2EDE4] hover:text-gray-900'
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
            <div className="flex-1 h-[100dvh] md:h-auto md:min-h-screen flex flex-col overflow-hidden">
                
                {/* Header Móvil (Solo visible en celular) */}
                <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur border-b border-[#E5D9D1] shadow-sm">
                    <div className="min-w-0">
                        <p className="text-xs text-gray-500">Negocio activo</p>
                        <p className="text-sm font-semibold text-[#262626] truncate">
                            {isLoading ? 'Cargando...' : currentBusiness?.name || 'Sin negocio'}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="touch-target w-11 h-11"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </Button>
                </header>

                {/* Menú Móvil Desplegable */}
                {isMobileMenuOpen && (
                    <div
                        className="md:hidden fixed inset-0 z-50 bg-black/35"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <div
                            className="absolute inset-x-0 top-0 bg-white border-b border-[#E5D9D1] shadow-xl rounded-b-2xl px-4 pb-4 pt-20 flex flex-col gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                        {menuItems.map((item) => (
                            <Link 
                                key={item.path} 
                                to={item.path} 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`touch-target p-3 rounded-xl flex items-center gap-3 ${
                                    location.pathname === item.path
                                        ? 'bg-[#F24452]/10 text-[#F24452]'
                                        : 'hover:bg-[#F2EDE4] text-[#262626]'
                                }`}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        ))}
                            <Button
                                variant="destructive"
                                onClick={logout}
                                className="mt-1 touch-target"
                            >
                                Salir
                            </Button>
                        </div>
                    </div>
                )}

                {/* ÁREA DE CONTENIDO (Aquí se renderizan las páginas) */}
                <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 md:p-8 md:pb-8">
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
                {/* Bottom nav mobile */}
                <nav className="md:hidden shrink-0 z-40 border-t border-[#E5D9D1] bg-white/95 backdrop-blur px-2 pt-2 mobile-bottom-nav">
                    <div className="mx-auto max-w-[720px] grid grid-cols-5 gap-1">
                        {mobileQuickNav.map((item) => {
                            const Icon = item.icon;
                            const isActive =
                                location.pathname === item.path ||
                                (item.path === '/dashboard' && location.pathname === '/dashboard/');

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 text-[11px] leading-tight min-h-[52px] ${
                                        isActive
                                            ? 'bg-[#F24452]/10 text-[#F24452] font-semibold'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="truncate max-w-full">{item.label.split(' ')[0]}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </div>
    );
}