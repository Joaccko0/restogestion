import { useMemo, useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useExpenses } from '../hooks/useExpenses';
import { useSuppliers } from '../hooks/useSuppliers';
import { useSupplies } from '../hooks/useSupplies';
import { useSearch } from '../hooks/useSearch';
import {
    Plus,
    DollarSign,
    Calendar,
    Receipt,
    Building2,
    Package,
    Search,
    RefreshCw,
    Filter,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

import { ExpenseForm } from '../components/ExpenseForm';
import { ExpenseTable } from '../components/ExpenseTable';
import { ExpenseDetailsDialog } from '../components/ExpenseDetailsDialog';
import { SupplierForm } from '../components/SupplierForm';
import { SupplierTable } from '../components/SupplierTable';
import { SupplyForm } from '../components/SupplyForm';
import { SupplyTable } from '../components/SupplyTable';
import { ConfirmDialog } from '../components/ConfirmDialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import type { Expense, ExpenseRequest } from '../types/expense.types';
import type { Supplier, SupplierRequest } from '../types/supplier.types';
import type { Supply } from '../types/supply.types';
import { SupplyCategory } from '../types/supply.types';

type DateFilter = 'all' | 'month' | 'last30';

function parseExpenseDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
}

function matchesDateFilter(dateStr: string, filter: DateFilter): boolean {
    if (filter === 'all') return true;
    const expenseDate = parseExpenseDate(dateStr);
    const now = new Date();
    if (filter === 'month') {
        return (
            expenseDate.getMonth() === now.getMonth() &&
            expenseDate.getFullYear() === now.getFullYear()
        );
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    cutoff.setHours(0, 0, 0, 0);
    return expenseDate >= cutoff;
}

export default function ExpensesPage() {
    const { currentBusiness } = useBusiness();

    const {
        expenses,
        isLoading: expensesLoading,
        loadExpenses,
        createExpense,
        updateExpense,
        deleteExpense,
    } = useExpenses(currentBusiness?.id || null);

    const {
        suppliers,
        isLoading: suppliersLoading,
        createSupplier,
        updateSupplier,
        deleteSupplier,
    } = useSuppliers(currentBusiness?.id || null);

    const {
        supplies,
        isLoading: suppliesLoading,
        createSupply,
        updateSupply,
        deleteSupply,
    } = useSupplies(currentBusiness?.id || null);

    const [activeTab, setActiveTab] = useState('expenses');
    const [expenseSearch, setExpenseSearch] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplySearch, setSupplySearch] = useState('');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);

    const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);

    const [isSupplyFormOpen, setIsSupplyFormOpen] = useState(false);
    const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
    const [supplyToDelete, setSupplyToDelete] = useState<number | null>(null);

    const filteredSuppliers = useSearch(suppliers, supplierSearch, ['name', 'contactInfo']);
    const filteredSupplies = useSearch(supplies, supplySearch, ['name']);

    const filteredExpenses = useMemo(() => {
        const term = expenseSearch.trim().toLowerCase();
        return expenses
            .filter((exp) => matchesDateFilter(exp.date, dateFilter))
            .filter((exp) => {
                if (!term) return true;
                const supplier = (exp.supplierName || '').toLowerCase();
                const items = exp.items
                    .map((i) => i.supplyName || '')
                    .join(' ')
                    .toLowerCase();
                const id = String(exp.id);
                return supplier.includes(term) || items.includes(term) || id.includes(term);
            })
            .sort(
                (a, b) =>
                    parseExpenseDate(b.date).getTime() - parseExpenseDate(a.date).getTime()
            );
    }, [expenses, expenseSearch, dateFilter]);

    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = expenses.filter((exp) => {
            const d = parseExpenseDate(exp.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        return {
            total: expenses.reduce((sum, exp) => sum + exp.total, 0),
            thisMonth: thisMonth.reduce((sum, exp) => sum + exp.total, 0),
            count: expenses.length,
            thisMonthCount: thisMonth.length,
        };
    }, [expenses]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([loadExpenses()]);
        setIsRefreshing(false);
    };

    const handleOpenExpenseForm = (expense?: Expense) => {
        setEditingExpense(expense ?? null);
        setIsExpenseFormOpen(true);
    };

    const handleSubmitExpense = async (formData: ExpenseRequest) => {
        if (editingExpense) {
            return updateExpense(editingExpense.id, formData);
        }
        return createExpense(formData);
    };

    const handleOpenSupplierForm = (supplier?: Supplier) => {
        setEditingSupplier(supplier ?? null);
        setIsSupplierFormOpen(true);
    };

    const handleSubmitSupplier = async (
        formData: SupplierRequest,
        id?: number
    ): Promise<boolean> => {
        try {
            if (id) await updateSupplier(id, formData);
            else await createSupplier(formData);
            return true;
        } catch {
            return false;
        }
    };

    const handleOpenSupplyForm = (supply?: Supply) => {
        setEditingSupply(supply ?? null);
        setIsSupplyFormOpen(true);
    };

    const handleSubmitSupply = async (
        formData: Omit<Supply, 'id' | 'businessId'>,
        id?: number
    ) => {
        if (id) await updateSupply(id, formData);
        else await createSupply(formData);
        setIsSupplyFormOpen(false);
        setEditingSupply(null);
    };

    return (
        <div className="app-page">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#262626] flex items-center gap-2">
                        <DollarSign className="h-7 w-7 text-[#F24452]" />
                        Gastos
                    </h2>
                    <p className="text-gray-500 mt-0.5">
                        Registrá facturas, proveedores e insumos de tu negocio
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleRefresh()}
                    disabled={isRefreshing}
                    className="border-[#E5D9D1] text-gray-600 hover:bg-[#F2EDE4] shrink-0 self-start sm:self-auto touch-target"
                >
                    <RefreshCw
                        className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                    Actualizar
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E5D9D1]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Total histórico</span>
                        <div className="p-2 bg-[#F24452]/10 rounded-lg">
                            <DollarSign className="h-4 w-4 text-[#F24452]" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#262626] tabular-nums">
                        {formatCurrency(stats.total)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{stats.count} registros</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E5D9D1]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Este mes</span>
                        <div className="p-2 bg-[#F2EDE4] rounded-lg">
                            <Calendar className="h-4 w-4 text-[#262626]" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#F24452] tabular-nums">
                        {formatCurrency(stats.thisMonth)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {stats.thisMonthCount} gastos en el mes
                    </p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E5D9D1]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Catálogo</span>
                        <div className="p-2 bg-[#F2EDE4] rounded-lg">
                            <Package className="h-4 w-4 text-[#262626]" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#262626]">
                        {suppliers.length}{' '}
                        <span className="text-base font-normal text-gray-400">prov.</span>{' '}
                        · {supplies.length}{' '}
                        <span className="text-base font-normal text-gray-400">insumos</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Base para registrar gastos</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-[#E5D9D1] w-full grid grid-cols-3 h-auto p-1">
                    <TabsTrigger
                        value="expenses"
                        className="touch-target data-[state=active]:bg-[#F24452] data-[state=active]:text-white gap-1.5 text-[11px] sm:text-sm"
                    >
                        <Receipt className="h-4 w-4 shrink-0" />
                        <span className="truncate">Gastos ({filteredExpenses.length})</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="suppliers"
                        className="touch-target data-[state=active]:bg-[#F24452] data-[state=active]:text-white gap-1.5 text-[11px] sm:text-sm"
                    >
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span className="truncate">Proveedores ({filteredSuppliers.length})</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="supplies"
                        className="touch-target data-[state=active]:bg-[#F24452] data-[state=active]:text-white gap-1.5 text-[11px] sm:text-sm"
                    >
                        <Package className="h-4 w-4 shrink-0" />
                        <span className="truncate">Insumos ({filteredSupplies.length})</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="expenses" className="space-y-4 mt-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-[#E5D9D1]">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por proveedor, insumo o #..."
                                className="pl-9 pr-3 h-11 bg-[#F2EDE4] border-none"
                                value={expenseSearch}
                                onChange={(e) => setExpenseSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Filter className="h-4 w-4 text-gray-400 hidden sm:block" />
                            <Select
                                value={dateFilter}
                                onValueChange={(v) => setDateFilter(v as DateFilter)}
                            >
                            <SelectTrigger className="w-full sm:w-[160px] bg-[#F2EDE4] border-none h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="all">Todas las fechas</SelectItem>
                                    <SelectItem value="month">Este mes</SelectItem>
                                    <SelectItem value="last30">Últimos 30 días</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                className="bg-[#F24452] hover:bg-[#F23D3D] text-white shrink-0 touch-target"
                                onClick={() => handleOpenExpenseForm()}
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Nuevo gasto
                            </Button>
                        </div>
                    </div>

                    <ExpenseTable
                        expenses={filteredExpenses}
                        isLoading={expensesLoading}
                        onEdit={handleOpenExpenseForm}
                        onDelete={setExpenseToDelete}
                        onView={setViewingExpense}
                        onCreateFirst={() => handleOpenExpenseForm()}
                        onGoToSupplies={() => setActiveTab('supplies')}
                        hasSupplies={supplies.length > 0}
                    />
                </TabsContent>

                <TabsContent value="suppliers" className="space-y-4 mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-[#E5D9D1]">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar proveedor..."
                                className="pl-9 pr-3 h-11 bg-[#F2EDE4] border-none"
                                value={supplierSearch}
                                onChange={(e) => setSupplierSearch(e.target.value)}
                            />
                        </div>
                        <Button
                            className="bg-[#F24452] hover:bg-[#F23D3D] text-white shrink-0 touch-target"
                            onClick={() => handleOpenSupplierForm()}
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Nuevo proveedor
                        </Button>
                    </div>
                    <SupplierTable
                        suppliers={filteredSuppliers}
                        isLoading={suppliersLoading}
                        onEdit={handleOpenSupplierForm}
                        onDelete={setSupplierToDelete}
                        onCreateFirst={() => handleOpenSupplierForm()}
                    />
                </TabsContent>

                <TabsContent value="supplies" className="space-y-4 mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-[#E5D9D1]">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar insumo..."
                                className="pl-9 pr-3 h-11 bg-[#F2EDE4] border-none"
                                value={supplySearch}
                                onChange={(e) => setSupplySearch(e.target.value)}
                            />
                        </div>
                        <Button
                            className="bg-[#F24452] hover:bg-[#F23D3D] text-white shrink-0 touch-target"
                            onClick={() => handleOpenSupplyForm()}
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Nuevo insumo
                        </Button>
                    </div>
                    <SupplyTable
                        supplies={filteredSupplies}
                        isLoading={suppliesLoading}
                        onEdit={handleOpenSupplyForm}
                        onDelete={setSupplyToDelete}
                        onCreateFirst={() => handleOpenSupplyForm()}
                    />
                </TabsContent>
            </Tabs>

            <ExpenseForm
                open={isExpenseFormOpen}
                onOpenChange={(open) => {
                    setIsExpenseFormOpen(open);
                    if (!open) setEditingExpense(null);
                }}
                onSubmit={handleSubmitExpense}
                editingExpense={editingExpense || undefined}
                suppliers={suppliers}
                supplies={supplies}
                onCreateSupply={() => {
                    setIsExpenseFormOpen(false);
                    setActiveTab('supplies');
                    handleOpenSupplyForm();
                }}
            />

            <SupplierForm
                open={isSupplierFormOpen}
                onOpenChange={(open) => {
                    setIsSupplierFormOpen(open);
                    if (!open) setEditingSupplier(null);
                }}
                onSubmit={handleSubmitSupplier}
                editingSupplier={editingSupplier || undefined}
            />

            <SupplyForm
                isOpen={isSupplyFormOpen}
                onClose={() => {
                    setIsSupplyFormOpen(false);
                    setEditingSupply(null);
                }}
                onSave={handleSubmitSupply}
                supply={editingSupply}
                defaultCategory={SupplyCategory.SERVICE}
            />

            <ExpenseDetailsDialog
                open={!!viewingExpense}
                onOpenChange={(open) => !open && setViewingExpense(null)}
                expense={viewingExpense}
                onEdit={(expense) => {
                    setViewingExpense(null);
                    handleOpenExpenseForm(expense);
                }}
            />

            <ConfirmDialog
                open={!!expenseToDelete}
                onOpenChange={(open) => !open && setExpenseToDelete(null)}
                onConfirm={async () => {
                    if (expenseToDelete) {
                        await deleteExpense(expenseToDelete);
                        setExpenseToDelete(null);
                    }
                }}
                title="Eliminar gasto"
                description="¿Eliminar este gasto? No podés deshacer esta acción."
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />

            <ConfirmDialog
                open={!!supplierToDelete}
                onOpenChange={(open) => !open && setSupplierToDelete(null)}
                onConfirm={async () => {
                    if (supplierToDelete) {
                        await deleteSupplier(supplierToDelete);
                        setSupplierToDelete(null);
                    }
                }}
                title="Eliminar proveedor"
                description="¿Eliminar este proveedor? Los gastos existentes no se borran."
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />

            <ConfirmDialog
                open={!!supplyToDelete}
                onOpenChange={(open) => !open && setSupplyToDelete(null)}
                onConfirm={async () => {
                    if (supplyToDelete) {
                        await deleteSupply(supplyToDelete);
                        setSupplyToDelete(null);
                    }
                }}
                title="Eliminar insumo"
                description="¿Eliminar este insumo? No podés usarlo en gastos nuevos."
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />
        </div>
    );
}
