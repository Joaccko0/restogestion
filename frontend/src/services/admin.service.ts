import client from '../api/client';
import type { BusinessBillingStatus } from './me.service';

export interface AdminBusiness {
    id: number;
    name: string;
    billingStatus: BusinessBillingStatus;
    expiresAt: string | null;
}

export interface AdminUser {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    superAdmin: boolean;
    businessRoles: { linkId: number; businessId: number; businessName: string; role: string }[];
}

export const AdminService = {
    async listBusinesses(): Promise<AdminBusiness[]> {
        const { data } = await client.get<AdminBusiness[]>('/admin/businesses');
        return data;
    },

    async createBusiness(payload: {
        name: string;
        billingStatus?: BusinessBillingStatus;
        expiresAt?: string | null;
    }): Promise<AdminBusiness> {
        const { data } = await client.post<AdminBusiness>('/admin/businesses', payload);
        return data;
    },

    async patchBusiness(
        id: number,
        payload: { name?: string; billingStatus?: BusinessBillingStatus; expiresAt?: string | null }
    ): Promise<AdminBusiness> {
        const { data } = await client.patch<AdminBusiness>(`/admin/businesses/${id}`, payload);
        return data;
    },

    async listUsers(): Promise<AdminUser[]> {
        const { data } = await client.get<AdminUser[]>('/admin/users');
        return data;
    },

    async createUser(payload: {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
    }): Promise<AdminUser> {
        const { data } = await client.post<AdminUser>('/admin/users', payload);
        return data;
    },

    async patchUser(
        id: number,
        payload: { firstName?: string; lastName?: string; password?: string }
    ): Promise<AdminUser> {
        const { data } = await client.patch<AdminUser>(`/admin/users/${id}`, payload);
        return data;
    },

    async assignRole(userId: number, businessId: number, role: 'OWNER' | 'EMPLOYEE'): Promise<AdminUser> {
        const { data } = await client.post<AdminUser>(`/admin/users/${userId}/roles`, { businessId, role });
        return data;
    },

    async removeRole(userId: number, businessId: number): Promise<AdminUser> {
        const { data } = await client.delete<AdminUser>(`/admin/users/${userId}/roles`, {
            params: { businessId },
        });
        return data;
    },
};
