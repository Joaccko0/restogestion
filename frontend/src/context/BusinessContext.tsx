import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { MeService, type BusinessSummary } from '../services/me.service';

interface BusinessContextType {
    currentBusiness: BusinessSummary | null;
    isLoading: boolean;
    refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

/**
 * Carga el negocio actual desde GET /api/me/businesses (primer negocio del usuario; piloto 1 cliente).
 */
export const BusinessProvider = ({ children }: { children: ReactNode }) => {
    const { token, isAuthenticated } = useAuth();
    const [currentBusiness, setCurrentBusiness] = useState<BusinessSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            setCurrentBusiness(null);
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            try {
                const list = await MeService.getMyBusinesses();
                if (!cancelled) {
                    setCurrentBusiness(list.length > 0 ? list[0] : null);
                }
            } catch (error) {
                console.error('Error cargando negocios del usuario', error);
                if (!cancelled) {
                    setCurrentBusiness(null);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [token, isAuthenticated]);

    const refreshBusiness = async () => {
        if (!isAuthenticated || !token) return;
        try {
            const list = await MeService.getMyBusinesses();
            setCurrentBusiness(list.length > 0 ? list[0] : null);
        } catch (error) {
            console.error('Error actualizando negocio', error);
        }
    };

    return (
        <BusinessContext.Provider value={{ currentBusiness, isLoading, refreshBusiness }}>
            {children}
        </BusinessContext.Provider>
    );
};

export const useBusiness = () => {
    const context = useContext(BusinessContext);
    if (!context) throw new Error('useBusiness debe usarse dentro de BusinessProvider');
    return context;
};
