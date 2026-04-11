import client from '../api/client';

export type BusinessBillingStatus = 'GRATIS' | 'VIGENTE' | 'MOROSO' | 'VENCIDO';

export interface BusinessSummary {
    id: number;
    name: string;
    billingStatus: BusinessBillingStatus;
    expiresAt: string | null;
    warningExpirySoon: boolean;
    morosoGraceDaysLeft: number;
}

export interface MeSession {
    superAdmin: boolean;
    email: string;
}

export const MeService = {
    async getSession(): Promise<MeSession> {
        const { data } = await client.get<MeSession>('/me/session');
        return data;
    },

    async getMyBusinesses(): Promise<BusinessSummary[]> {
        const { data } = await client.get<BusinessSummary[]>('/me/businesses');
        return data;
    },
};
