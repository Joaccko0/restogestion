import { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useCustomers } from '../hooks/useCustomers';
import { useSearch } from '../hooks/useSearch';
import { Plus, Search, Users, MapPin, RefreshCw } from 'lucide-react';

import { CustomerForm } from '../components/CustomerForm';
import { CustomerTable } from '../components/CustomerTable';
import { AddressManagerDialog } from '../components/AddressManagerDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { Customer } from '../types/customer.types';

export default function CustomersPage() {
    const { currentBusiness } = useBusiness();

    const { customers, isLoading, createCustomer, updateCustomer, deleteCustomer, loadCustomers } =
        useCustomers(currentBusiness?.id || null);

    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const filteredCustomers = useSearch(customers, searchTerm, ['name', 'phone']);

    const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);

    const [isAddressManagerOpen, setIsAddressManagerOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const stats = useMemo(() => {
        const withAddresses = customers.filter((c) => c.addresses.length > 0).length;
        return {
            total: customers.length,
            withAddresses,
            showing: filteredCustomers.length,
        };
    }, [customers, filteredCustomers.length]);

    const handleOpenCustomerForm = (customer?: Customer) => {
        setEditingCustomer(customer ?? null);
        setIsCustomerFormOpen(true);
    };

    const handleSubmitCustomer = async (formData: Parameters<typeof createCustomer>[0]) => {
        if (editingCustomer) {
            return await updateCustomer(editingCustomer.id, formData);
        }
        return await createCustomer(formData);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadCustomers();
        setIsRefreshing(false);
    };

    useEffect(() => {
        if (selectedCustomer) {
            const updatedCustomer = customers.find((c) => c.id === selectedCustomer.id);
            if (updatedCustomer) {
                setSelectedCustomer(updatedCustomer);
            }
        }
    }, [customers, selectedCustomer]);

    return (
        <div className="app-page">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#262626] flex items-center gap-2">
                        <Users className="h-7 w-7 text-[#F24452]" />
                        Clientes
                    </h2>
                    <p className="text-gray-500 mt-0.5">
                        Gestioná clientes y direcciones de entrega
                    </p>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleRefresh()}
                        disabled={isRefreshing}
                        className="border-[#E5D9D1] text-gray-600 hover:bg-[#F2EDE4] touch-target"
                    >
                        <RefreshCw
                            className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`}
                        />
                        Actualizar
                    </Button>
                    <Button
                        onClick={() => handleOpenCustomerForm()}
                        className="bg-[#F24452] hover:bg-[#F23D3D] text-white touch-target"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo cliente
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E5D9D1]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Total clientes</span>
                        <div className="p-2 bg-[#F24452]/10 rounded-lg">
                            <Users className="h-4 w-4 text-[#F24452]" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#262626] tabular-nums">{stats.total}</p>
                    <p className="text-xs text-gray-400 mt-1">Registrados en el negocio</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E5D9D1]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Con dirección</span>
                        <div className="p-2 bg-[#F2EDE4] rounded-lg">
                            <MapPin className="h-4 w-4 text-[#262626]" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#F24452] tabular-nums">
                        {stats.withAddresses}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Listos para delivery</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E5D9D1]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">En pantalla</span>
                        <div className="p-2 bg-[#F2EDE4] rounded-lg">
                            <Search className="h-4 w-4 text-[#262626]" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#262626] tabular-nums">{stats.showing}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {searchTerm.trim() ? 'Coinciden con la búsqueda' : 'Sin filtros activos'}
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl shadow-sm border border-[#E5D9D1]">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        type="text"
                        placeholder="Buscar por nombre o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-11 bg-[#F2EDE4] border-none focus-visible:ring-0 focus:border-[#F24452]"
                    />
                </div>
            </div>

            <CustomerTable
                customers={filteredCustomers}
                isLoading={isLoading}
                onEdit={handleOpenCustomerForm}
                onDelete={setCustomerToDelete}
                onManageAddresses={(customer) => {
                    setSelectedCustomer(customer);
                    setIsAddressManagerOpen(true);
                }}
                onCreateFirst={() => handleOpenCustomerForm()}
                hasSearch={!!searchTerm.trim()}
            />

            <CustomerForm
                open={isCustomerFormOpen}
                onOpenChange={setIsCustomerFormOpen}
                onSubmit={handleSubmitCustomer}
                editingCustomer={editingCustomer || undefined}
            />

            <AddressManagerDialog
                open={isAddressManagerOpen}
                onOpenChange={setIsAddressManagerOpen}
                customer={selectedCustomer}
                businessId={currentBusiness?.id || 0}
                onAddressesChanged={loadCustomers}
            />

            <ConfirmDialog
                open={!!customerToDelete}
                onOpenChange={(open) => !open && setCustomerToDelete(null)}
                onConfirm={async () => {
                    if (customerToDelete) {
                        await deleteCustomer(customerToDelete);
                        setCustomerToDelete(null);
                    }
                }}
                title="Eliminar cliente"
                description="¿Estás seguro? Los datos históricos de pedidos se mantienen."
            />
        </div>
    );
}
