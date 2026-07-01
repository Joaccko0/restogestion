/**
 * Dialog para seleccionar cliente y dirección de entrega.
 * Delivery: flujo unificado — elegís cliente y dirección en la misma vista.
 */

import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Search,
    UserPlus,
    MapPin,
    X,
    Phone,
    ChevronRight,
    Check,
    User,
    Hash,
    MessageSquare,
    Loader2,
    PenLine,
} from 'lucide-react';
import type { Customer } from '../types/customer.types';
import { CustomerService } from '../services/customer.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CustomerAddressSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customers: Customer[];
    businessId: number;
    isDelivery: boolean;
    initialCustomerId?: number;
    initialAddressId?: number;
    initialManualAddress?: string;
    onConfirm: (data: {
        customerId?: number;
        addressId?: number;
        manualAddress?: string;
    }) => void;
    onCustomersChanged: () => void;
}

const FIELD =
    'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:border-[#F24452] focus-visible:ring-[#F24452]/20 h-10';

function formatAddress(street: string, number: string, description?: string) {
    const base = `${street} ${number}`;
    return description ? `${base} — ${description}` : base;
}

function CustomerAvatar({
    name,
    selected,
    done,
}: {
    name: string;
    selected?: boolean;
    done?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-all',
                done
                    ? 'bg-[#F24452] text-white ring-2 ring-[#F24452]/30'
                    : selected
                      ? 'bg-[#F24452]/15 text-[#F24452] ring-2 ring-[#F24452]/40'
                      : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
            )}
        >
            {done ? <Check className="h-5 w-5" /> : name.charAt(0).toUpperCase()}
        </div>
    );
}

export function CustomerAddressSelector({
    open,
    onOpenChange,
    customers,
    businessId,
    isDelivery,
    initialCustomerId,
    initialAddressId,
    initialManualAddress,
    onConfirm,
    onCustomersChanged,
}: CustomerAddressSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(initialCustomerId);
    const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>(initialAddressId);
    const [manualAddress, setManualAddress] = useState(initialManualAddress || '');
    const [useManualAddress, setUseManualAddress] = useState(!!initialManualAddress && !initialCustomerId);
    const [expandedCustomerId, setExpandedCustomerId] = useState<number | undefined>(initialCustomerId);

    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [creatingCustomer, setCreatingCustomer] = useState(false);
    const [creatingAddress, setCreatingAddress] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newAddressStreet, setNewAddressStreet] = useState('');
    const [newAddressNumber, setNewAddressNumber] = useState('');
    const [newAddressDescription, setNewAddressDescription] = useState('');

    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
    const selectedAddressObj = selectedCustomer?.addresses.find((a) => a.id === selectedAddressId);

    useEffect(() => {
        if (open) {
            setSearchTerm('');
            setSelectedCustomerId(initialCustomerId);
            setSelectedAddressId(initialAddressId);
            setManualAddress(initialManualAddress || '');
            setUseManualAddress(!!initialManualAddress && !initialCustomerId);
            setExpandedCustomerId(initialCustomerId);
            setShowCustomerForm(false);
            setShowAddressForm(false);
        }
    }, [open, initialCustomerId, initialAddressId, initialManualAddress]);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm.trim()) return customers;
        const term = searchTerm.toLowerCase();
        return customers.filter(
            (c) =>
                c.name.toLowerCase().includes(term) ||
                c.phone.toLowerCase().includes(term) ||
                c.addresses?.some(
                    (a) =>
                        `${a.street} ${a.number}`.toLowerCase().includes(term) ||
                        (a.description || '').toLowerCase().includes(term)
                )
        );
    }, [customers, searchTerm]);

    const switchToClients = () => {
        setUseManualAddress(false);
        setManualAddress('');
    };

    const switchToManual = () => {
        setUseManualAddress(true);
        setSelectedCustomerId(undefined);
        setSelectedAddressId(undefined);
        setExpandedCustomerId(undefined);
        setShowCustomerForm(false);
        setShowAddressForm(false);
    };

    const selectCustomer = (customer: Customer) => {
        switchToClients();
        setSelectedCustomerId(customer.id);
        setExpandedCustomerId(customer.id);
        setShowAddressForm(false);

        const addresses = customer.addresses || [];
        if (addresses.length === 1) {
            setSelectedAddressId(addresses[0].id);
        } else if (selectedCustomerId !== customer.id) {
            setSelectedAddressId(undefined);
        }
    };

    const selectAddress = (customerId: number, addressId: number) => {
        switchToClients();
        setSelectedCustomerId(customerId);
        setExpandedCustomerId(customerId);
        setSelectedAddressId(addressId);
    };

    const handleCreateCustomer = async () => {
        if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
            toast.error('Completá nombre y teléfono');
            return;
        }
        setCreatingCustomer(true);
        try {
            const customer = await CustomerService.createCustomer(businessId, {
                name: newCustomerName.trim(),
                phone: newCustomerPhone.trim(),
            });
            toast.success('Cliente creado');
            setNewCustomerName('');
            setNewCustomerPhone('');
            setShowCustomerForm(false);
            await onCustomersChanged();
            selectCustomer({ ...customer, addresses: [] });
            setShowAddressForm(true);
        } catch (err) {
            toast.error('Error al crear el cliente');
            console.error(err);
        } finally {
            setCreatingCustomer(false);
        }
    };

    const handleCreateAddress = async () => {
        if (!selectedCustomerId || !newAddressStreet.trim() || !newAddressNumber.trim()) {
            toast.error('Completá calle y número');
            return;
        }
        setCreatingAddress(true);
        try {
            const address = await CustomerService.createAddress(businessId, selectedCustomerId, {
                street: newAddressStreet.trim(),
                number: newAddressNumber.trim(),
                description: newAddressDescription.trim(),
            });
            toast.success('Dirección agregada');
            setNewAddressStreet('');
            setNewAddressNumber('');
            setNewAddressDescription('');
            setShowAddressForm(false);
            await onCustomersChanged();
            selectAddress(selectedCustomerId, address.id);
        } catch (err) {
            toast.error('Error al crear la dirección');
            console.error(err);
        } finally {
            setCreatingAddress(false);
        }
    };

    const handleConfirm = () => {
        if (isDelivery) {
            if (useManualAddress) {
                if (!manualAddress.trim()) {
                    toast.error('Ingresá la dirección de entrega');
                    return;
                }
            } else if (!selectedAddressId) {
                toast.error('Elegí una dirección de entrega');
                return;
            }
        }

        onConfirm({
            customerId: useManualAddress ? undefined : selectedCustomerId,
            addressId: useManualAddress ? undefined : selectedAddressId,
            manualAddress: useManualAddress ? manualAddress.trim() : undefined,
        });
        onOpenChange(false);
    };

    const deliveryReady = useManualAddress
        ? !!manualAddress.trim()
        : !!(selectedCustomerId && selectedAddressId);

    const NewCustomerForm = ({ onCancel }: { onCancel: () => void }) => (
        <div className="rounded-xl border-2 border-[#F24452]/40 bg-gradient-to-b from-[#FFF5F5] to-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-[#F24452]/10 border-b border-[#F24452]/20">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F24452] text-white">
                        <UserPlus className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Nuevo cliente</p>
                        <p className="text-xs text-gray-500">Se agregará a tu lista de clientes</p>
                    </div>
                </div>
                <Button type="button" size="icon-sm" variant="ghost" onClick={onCancel}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                    <Label htmlFor="new-customer-name" className="text-xs font-medium text-gray-600">
                        Nombre completo
                    </Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="new-customer-name"
                            placeholder="Ej: Juan Pérez"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            className={cn(FIELD, 'pl-10')}
                            autoFocus
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="new-customer-phone" className="text-xs font-medium text-gray-600">
                        Teléfono
                    </Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="new-customer-phone"
                            placeholder="Ej: 11 2345-6789"
                            value={newCustomerPhone}
                            onChange={(e) => setNewCustomerPhone(e.target.value)}
                            className={cn(FIELD, 'pl-10')}
                        />
                    </div>
                </div>
                <Button
                    type="button"
                    onClick={handleCreateCustomer}
                    disabled={creatingCustomer}
                    className="w-full h-10 bg-[#F24452] hover:bg-[#d93a48] font-semibold"
                >
                    {creatingCustomer ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        'Crear cliente y cargar dirección'
                    )}
                </Button>
            </div>
        </div>
    );

    const NewAddressForm = ({ customerName, onCancel }: { customerName: string; onCancel: () => void }) => (
        <div className="rounded-xl border-2 border-[#F24452]/40 bg-white overflow-hidden shadow-sm mt-2">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F24452]/10 text-[#F24452]">
                    <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">Nueva dirección</p>
                    <p className="text-xs text-gray-500 truncate">Para {customerName}</p>
                </div>
                <Button type="button" size="icon-sm" variant="ghost" onClick={onCancel}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                    <Label htmlFor="new-addr-street" className="text-xs font-medium text-gray-600">
                        Calle
                    </Label>
                    <Input
                        id="new-addr-street"
                        placeholder="Ej: Av. Corrientes"
                        value={newAddressStreet}
                        onChange={(e) => setNewAddressStreet(e.target.value)}
                        className={FIELD}
                        autoFocus
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="new-addr-number" className="text-xs font-medium text-gray-600">
                            Número
                        </Label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                id="new-addr-number"
                                placeholder="1234"
                                value={newAddressNumber}
                                onChange={(e) => setNewAddressNumber(e.target.value)}
                                className={cn(FIELD, 'pl-9')}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="new-addr-ref" className="text-xs font-medium text-gray-600">
                            Referencia
                        </Label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                id="new-addr-ref"
                                placeholder="Piso, depto..."
                                value={newAddressDescription}
                                onChange={(e) => setNewAddressDescription(e.target.value)}
                                className={cn(FIELD, 'pl-9')}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={creatingAddress}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        className="flex-1 bg-[#F24452] hover:bg-[#d93a48]"
                        onClick={handleCreateAddress}
                        disabled={creatingAddress}
                    >
                        {creatingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar dirección'}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <DialogTitle className="text-xl">
                        {isDelivery ? 'Destino de entrega' : 'Cliente (opcional)'}
                    </DialogTitle>
                    <DialogDescription>
                        {isDelivery
                            ? 'Elegí un cliente con dirección o ingresá una dirección manual.'
                            : 'Asociá un cliente al pedido si querés.'}
                    </DialogDescription>
                </DialogHeader>

                {/* Resumen selección */}
                {isDelivery && useManualAddress && manualAddress.trim() && (
                    <div className="mx-6 mt-4 rounded-xl border-2 border-[#F24452]/30 bg-[#FFF5F5] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#F24452] mb-2">
                            Dirección manual
                        </p>
                        <p className="text-sm text-gray-800 flex items-start gap-2">
                            <PenLine className="h-4 w-4 text-[#F24452] shrink-0 mt-0.5" />
                            {manualAddress}
                        </p>
                    </div>
                )}
                {isDelivery && !useManualAddress && (selectedCustomer || selectedAddressObj) && (
                    <div className="mx-6 mt-4 rounded-xl border-2 border-[#F24452]/30 bg-[#FFF5F5] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#F24452] mb-2">
                            Destino seleccionado
                        </p>
                        {selectedCustomer && (
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">{selectedCustomer.name}</span>
                                <span className="text-gray-400">·</span>
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {selectedCustomer.phone}
                                </span>
                            </div>
                        )}
                        {selectedAddressObj ? (
                            <p className="text-sm text-gray-800 flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-[#F24452] shrink-0 mt-0.5" />
                                {formatAddress(
                                    selectedAddressObj.street,
                                    selectedAddressObj.number,
                                    selectedAddressObj.description
                                )}
                            </p>
                        ) : selectedCustomer ? (
                            <p className="text-sm text-amber-700 font-medium">
                                ↓ Elegí una dirección de la lista
                            </p>
                        ) : null}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
                    {isDelivery && (
                        /* Selector de modo: cliente vs manual */
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={switchToClients}
                                className={cn(
                                    'group relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all cursor-pointer',
                                    'hover:shadow-md active:scale-[0.98]',
                                    !useManualAddress
                                        ? 'border-[#F24452] bg-[#FFF5F5] shadow-sm ring-1 ring-[#F24452]/20'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                )}
                            >
                                {!useManualAddress && (
                                    <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#F24452] text-white">
                                        <Check className="h-3 w-3" />
                                    </span>
                                )}
                                <div
                                    className={cn(
                                        'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                                        !useManualAddress
                                            ? 'bg-[#F24452] text-white'
                                            : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                                    )}
                                >
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-900">Cliente registrado</p>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                                        Elegí de tu lista con direcciones guardadas
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={switchToManual}
                                className={cn(
                                    'group relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all cursor-pointer',
                                    'hover:shadow-md active:scale-[0.98]',
                                    useManualAddress
                                        ? 'border-[#F24452] bg-[#FFF5F5] shadow-sm ring-1 ring-[#F24452]/20'
                                        : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/30'
                                )}
                            >
                                {useManualAddress && (
                                    <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#F24452] text-white">
                                        <Check className="h-3 w-3" />
                                    </span>
                                )}
                                <div
                                    className={cn(
                                        'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                                        useManualAddress
                                            ? 'bg-[#F24452] text-white'
                                            : 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-600'
                                    )}
                                >
                                    <PenLine className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-900">Dirección manual</p>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                                        Escribí la dirección sin asociar cliente
                                    </p>
                                </div>
                            </button>
                        </div>
                    )}

                    {useManualAddress ? (
                        <div className="rounded-xl border-2 border-[#F24452]/30 bg-gradient-to-b from-[#FFF5F5] to-white p-4 space-y-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-[#F24452]" />
                                <Label htmlFor="manual-address" className="text-sm font-semibold text-gray-900">
                                    ¿A dónde enviamos el pedido?
                                </Label>
                            </div>
                            <Input
                                id="manual-address"
                                placeholder="Ej: Av. Corrientes 1234, Piso 2 Depto A — CABA"
                                value={manualAddress}
                                onChange={(e) => setManualAddress(e.target.value)}
                                className={cn(FIELD, 'h-11 text-base')}
                                autoFocus
                            />
                            <p className="text-xs text-gray-500">
                                Tip: incluí piso, departamento o referencias para el delivery.
                            </p>
                        </div>
                    ) : isDelivery ? (
                        <div className="space-y-3">
                            {/* Barra de búsqueda + nuevo cliente */}
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Buscar nombre, teléfono o calle..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={cn(FIELD, 'pl-10')}
                                    />
                                </div>
                                {!showCustomerForm && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="shrink-0 h-10 border-[#F24452]/30 text-[#F24452] hover:bg-[#FFF5F5] hover:text-[#F24452]"
                                        onClick={() => {
                                            setShowCustomerForm(true);
                                            setShowAddressForm(false);
                                        }}
                                    >
                                        <UserPlus className="w-4 h-4 mr-1.5" />
                                        Nuevo
                                    </Button>
                                )}
                            </div>

                            {showCustomerForm && (
                                <NewCustomerForm
                                    onCancel={() => {
                                        setShowCustomerForm(false);
                                        setNewCustomerName('');
                                        setNewCustomerPhone('');
                                    }}
                                />
                            )}

                            {!showCustomerForm && (
                                <>
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                            {filteredCustomers.length} cliente
                                            {filteredCustomers.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    <ScrollArea className="max-h-[42vh] sm:max-h-[300px] pr-1">
                                        <div className="space-y-2.5">
                                            {filteredCustomers.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
                                                    <User className="h-10 w-10 text-gray-300 mb-3" />
                                                    <p className="text-sm font-medium text-gray-600">
                                                        No hay clientes
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1 mb-4 text-center">
                                                        {searchTerm
                                                            ? 'Probá con otro término de búsqueda'
                                                            : 'Creá el primero para empezar'}
                                                    </p>
                                                    {!searchTerm && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className="bg-[#F24452] hover:bg-[#d93a48]"
                                                            onClick={() => setShowCustomerForm(true)}
                                                        >
                                                            <UserPlus className="h-4 w-4 mr-1.5" />
                                                            Crear cliente
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                filteredCustomers.map((customer) => {
                                                    const isExpanded = expandedCustomerId === customer.id;
                                                    const isSelected = selectedCustomerId === customer.id;
                                                    const addresses = customer.addresses || [];
                                                    const hasAddressSelected =
                                                        isSelected && !!selectedAddressId;
                                                    const firstAddress = addresses[0];

                                                    return (
                                                        <div
                                                            key={customer.id}
                                                            className={cn(
                                                                'rounded-xl border-2 overflow-hidden transition-all duration-200',
                                                                hasAddressSelected
                                                                    ? 'border-[#F24452] shadow-md shadow-[#F24452]/10'
                                                                    : isSelected
                                                                      ? 'border-[#F24452]/60 shadow-sm'
                                                                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                            )}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isExpanded) {
                                                                        setExpandedCustomerId(undefined);
                                                                    } else {
                                                                        selectCustomer(customer);
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    'w-full flex items-center gap-3 p-4 text-left transition-colors cursor-pointer',
                                                                    isSelected
                                                                        ? 'bg-gradient-to-r from-[#FFF5F5] to-white'
                                                                        : 'bg-white hover:bg-gray-50/80'
                                                                )}
                                                            >
                                                                <CustomerAvatar
                                                                    name={customer.name}
                                                                    selected={isSelected && !hasAddressSelected}
                                                                    done={hasAddressSelected}
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <p className="font-semibold text-gray-900">
                                                                            {customer.name}
                                                                        </p>
                                                                        {addresses.length === 0 ? (
                                                                            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                                                                Sin direcciones
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                                                {addresses.length}{' '}
                                                                                {addresses.length === 1
                                                                                    ? 'dir.'
                                                                                    : 'dirs.'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                                                                        <Phone className="h-3.5 w-3.5 shrink-0" />
                                                                        {customer.phone}
                                                                    </p>
                                                                    {!isExpanded && firstAddress && (
                                                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1 truncate">
                                                                            <MapPin className="h-3 w-3 shrink-0 text-[#F24452]/60" />
                                                                            {firstAddress.street} {firstAddress.number}
                                                                            {addresses.length > 1 &&
                                                                                ` +${addresses.length - 1} más`}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <ChevronRight
                                                                    className={cn(
                                                                        'h-5 w-5 text-gray-400 shrink-0 transition-transform duration-200',
                                                                        isExpanded && 'rotate-90 text-[#F24452]'
                                                                    )}
                                                                />
                                                            </button>

                                                            {isExpanded && (
                                                                <div className="border-t border-gray-100 bg-gray-50/60 px-3 py-3 space-y-2">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1">
                                                                        Direcciones de entrega
                                                                    </p>

                                                                    {addresses.length === 0 && !showAddressForm ? (
                                                                        <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/50 p-4 text-center">
                                                                            <MapPin className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                                                                            <p className="text-sm text-amber-800 font-medium">
                                                                                Sin direcciones cargadas
                                                                            </p>
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                className="mt-3 bg-[#F24452] hover:bg-[#d93a48]"
                                                                                onClick={() => {
                                                                                    selectCustomer(customer);
                                                                                    setShowAddressForm(true);
                                                                                }}
                                                                            >
                                                                                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                                                                                Cargar dirección
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        addresses.map((address) => {
                                                                            const isAddrSelected =
                                                                                selectedAddressId === address.id;
                                                                            return (
                                                                                <button
                                                                                    key={address.id}
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        selectAddress(
                                                                                            customer.id,
                                                                                            address.id
                                                                                        )
                                                                                    }
                                                                                    className={cn(
                                                                                        'w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all cursor-pointer',
                                                                                        isAddrSelected
                                                                                            ? 'bg-[#F24452] text-white shadow-lg shadow-[#F24452]/25 scale-[1.01]'
                                                                                            : 'bg-white border border-gray-200 hover:border-[#F24452]/50 hover:shadow-sm'
                                                                                    )}
                                                                                >
                                                                                    <div
                                                                                        className={cn(
                                                                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                                                                            isAddrSelected
                                                                                                ? 'bg-white/20'
                                                                                                : 'bg-[#F24452]/10'
                                                                                        )}
                                                                                    >
                                                                                        <MapPin
                                                                                            className={cn(
                                                                                                'h-4 w-4',
                                                                                                isAddrSelected
                                                                                                    ? 'text-white'
                                                                                                    : 'text-[#F24452]'
                                                                                            )}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="font-semibold text-sm">
                                                                                            {address.street}{' '}
                                                                                            {address.number}
                                                                                        </p>
                                                                                        {address.description && (
                                                                                            <p
                                                                                                className={cn(
                                                                                                    'text-xs mt-0.5',
                                                                                                    isAddrSelected
                                                                                                        ? 'text-white/85'
                                                                                                        : 'text-gray-500'
                                                                                                )}
                                                                                            >
                                                                                                {address.description}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                    {isAddrSelected && (
                                                                                        <Check className="h-5 w-5 shrink-0 mt-0.5" />
                                                                                    )}
                                                                                </button>
                                                                            );
                                                                        })
                                                                    )}

                                                                    {showAddressForm &&
                                                                        selectedCustomerId === customer.id && (
                                                                            <NewAddressForm
                                                                                customerName={customer.name}
                                                                                onCancel={() => {
                                                                                    setShowAddressForm(false);
                                                                                    setNewAddressStreet('');
                                                                                    setNewAddressNumber('');
                                                                                    setNewAddressDescription('');
                                                                                }}
                                                                            />
                                                                        )}

                                                                    {addresses.length > 0 &&
                                                                        selectedCustomerId === customer.id &&
                                                                        !showAddressForm && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowAddressForm(true)}
                                                                                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium text-[#F24452] hover:bg-[#FFF5F5] border border-dashed border-[#F24452]/30 transition-colors cursor-pointer"
                                                                            >
                                                                                <MapPin className="h-4 w-4" />
                                                                                Agregar otra dirección
                                                                            </button>
                                                                        )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </ScrollArea>
                                </>
                            )}
                        </div>
                    ) : (
                        /* No delivery */
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Nombre o teléfono..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={cn(FIELD, 'pl-10')}
                                    />
                                </div>
                                {!showCustomerForm && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowCustomerForm(true)}
                                    >
                                        <UserPlus className="w-4 h-4 mr-1" />
                                        Nuevo
                                    </Button>
                                )}
                            </div>
                            {showCustomerForm ? (
                                <NewCustomerForm
                                    onCancel={() => {
                                        setShowCustomerForm(false);
                                        setNewCustomerName('');
                                        setNewCustomerPhone('');
                                    }}
                                />
                            ) : (
                                <ScrollArea className="max-h-[42vh] sm:max-h-[280px]">
                                    <div className="space-y-2">
                                        {filteredCustomers.map((customer) => (
                                            <button
                                                key={customer.id}
                                                type="button"
                                                onClick={() => selectCustomer(customer)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer',
                                                    selectedCustomerId === customer.id
                                                        ? 'bg-[#F24452] text-white shadow-md'
                                                        : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                )}
                                            >
                                                <CustomerAvatar
                                                    name={customer.name}
                                                    done={selectedCustomerId === customer.id}
                                                />
                                                <div>
                                                    <div className="font-medium text-sm">{customer.name}</div>
                                                    <div
                                                        className={cn(
                                                            'text-xs',
                                                            selectedCustomerId === customer.id
                                                                ? 'text-white/80'
                                                                : 'text-gray-500'
                                                        )}
                                                    >
                                                        {customer.phone}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="touch-target">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isDelivery && !deliveryReady}
                        className="bg-[#F24452] hover:bg-[#d93a48] min-w-[140px] font-semibold touch-target"
                    >
                        {isDelivery ? 'Confirmar destino' : 'Confirmar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
