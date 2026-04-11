import { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useExpenses } from '../hooks/useExpenses';
import { useSuppliers } from '../hooks/useSuppliers';
import { useSupplies } from '../hooks/useSupplies';
import { Plus, DollarSign, Calendar, Package } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

import { ExpenseForm } from '../components/ExpenseForm';
import { ExpenseTable } from '../components/ExpenseTable';
import { ExpenseDetailsDialog } from '../components/ExpenseDetailsDialog';
import { SupplierForm } from '../components/SupplierForm';
import { SupplierTable } from '../components/SupplierTable';
import { SupplyForm } from '../components/SupplyForm';
import { SupplyTable } from '../components/SupplyTable';
import { ConfirmDialog } from '../components/ConfirmDialog';

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { Expense } from '../types/expense.types';
import type { Supplier, SupplierRequest } from '../types/supplier.types';
import type { Supply } from '../types/supply.types';
import { SupplyCategory } from '../types/supply.types';

/**
 * Página de gestión de gastos
 * Funcionalidades: CRUD completo de gastos con items anidados
 * Incluye pestañas para gestionar también Proveedores e Insumos
 */
export default function ExpensesPage() {
    const { currentBusiness } = useBusiness();
    
    // Hooks de lógica de negocio
    const { expenses, isLoading: expensesLoading, createExpense, updateExpense, deleteExpense } = useExpenses(
        currentBusiness?.id || null
    );
    const { suppliers, isLoading: suppliersLoading, createSupplier, updateSupplier, deleteSupplier } = useSuppliers(currentBusiness?.id || null);
    const { supplies, createSupply, updateSupply, deleteSupply } = useSupplies(currentBusiness?.id || null);

    // Estados de modales - Gastos
    const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);

    // Estados de modales - Proveedores
    const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);

    // Estados de modales - Insumos
    const [isSupplyFormOpen, setIsSupplyFormOpen] = useState(false);
    const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
    const [supplyToDelete, setSupplyToDelete] = useState<number | null>(null);

    // Manejadores de gastos
    const handleOpenExpenseForm = (expense?: Expense) => {
        if (expense) {
            setEditingExpense(expense);
        } else {
            setEditingExpense(null);
        }
        setIsExpenseFormOpen(true);
    };

    const handleSubmitExpense = async (formData: any) => {
        if (editingExpense) {
            return await updateExpense(editingExpense.id, formData);
        } else {
            return await createExpense(formData);
        }
    };

    const handleViewExpense = (expense: Expense) => {
        setViewingExpense(expense);
    };

    const handleDeleteExpenseClick = (id: number) => {
        setExpenseToDelete(id);
    };

    const handleConfirmDeleteExpense = async () => {
        if (expenseToDelete) {
            await deleteExpense(expenseToDelete);
            setExpenseToDelete(null);
        }
    };

    // Manejadores de proveedores
    const handleOpenSupplierForm = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
        } else {
            setEditingSupplier(null);
        }
        setIsSupplierFormOpen(true);
    };

    const handleSubmitSupplier = async (formData: SupplierRequest, id?: number): Promise<boolean> => {
        try {
            if (id) {
                await updateSupplier(id, formData);
            } else {
                await createSupplier(formData);
            }
            return true;
        } catch {
            return false;
        }
    };

    const handleDeleteSupplierClick = (id: number) => {
        setSupplierToDelete(id);
    };

    const handleConfirmDeleteSupplier = async () => {
        if (supplierToDelete) {
            await deleteSupplier(supplierToDelete);
            setSupplierToDelete(null);
        }
    };

    // Manejadores de insumos
    const handleOpenSupplyForm = (supply?: Supply) => {
        if (supply) {
            setEditingSupply(supply);
        } else {
            setEditingSupply(null);
        }
        setIsSupplyFormOpen(true);
    };

    const handleSubmitSupply = async (formData: Omit<Supply, 'id' | 'businessId'>, id?: number) => {
        if (id) {
            await updateSupply(id, formData);
        } else {
            await createSupply(formData);
        }
        setIsSupplyFormOpen(false);
        setEditingSupply(null);
    };

    const handleDeleteSupplyClick = (id: number) => {
        setSupplyToDelete(id);
    };

    const handleConfirmDeleteSupply = async () => {
        if (supplyToDelete) {
            await deleteSupply(supplyToDelete);
            setSupplyToDelete(null);
        }
    };

    // Cálculo de estadísticas rápidas
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.total, 0);
    const expensesThisMonth = expenses.filter(exp => {
        const expenseDate = new Date(exp.date);
        const now = new Date();
        return expenseDate.getMonth() === now.getMonth() && 
               expenseDate.getFullYear() === now.getFullYear();
    });
    const totalThisMonth = expensesThisMonth.reduce((sum, exp) => sum + exp.total, 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#0D0D0D] flex items-center gap-2">
                        <DollarSign className="h-8 w-8 text-[#F24452]" />
                        Gastos
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Registra y gestiona los gastos de tu negocio
                    </p>
                </div>
                
                <Button
                    onClick={() => handleOpenExpenseForm()}
                    className="bg-[#F24452] hover:bg-[#d93a48] text-white cursor-pointer"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Gasto
                </Button>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-lg shadow-sm border-2 border-[#F24452]/20 hover:border-[#F24452] transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-gray-600">Gastos Totales</div>
                        <div className="p-2 bg-[#F24452]/10 rounded-lg">
                            <DollarSign className="h-5 w-5 text-[#F24452]" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-[#F24452]">
                        {formatCurrency(totalExpenses)}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-lg shadow-sm border-2 border-orange-200 hover:border-orange-400 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-gray-600">Gastos Este Mes</div>
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-orange-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-orange-600">
                        {formatCurrency(totalThisMonth)}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg shadow-sm border-2 border-gray-200 hover:border-gray-400 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-gray-600">Cantidad de Gastos</div>
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Package className="h-5 w-5 text-gray-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">
                        {expenses.length}
                    </div>
                </div>
            </div>

            {/* Pestañas de navegación */}
            <Tabs defaultValue="expenses" className="w-full">
                <TabsList className="grid w-full md:w-auto grid-cols-3 bg-[#F5F1EB] p-1 rounded-lg">
                    <TabsTrigger 
                        value="expenses" 
                        className="cursor-pointer rounded-md data-[state=active]:bg-[#F24452] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                    >
                        💰 Gastos
                    </TabsTrigger>
                    <TabsTrigger 
                        value="suppliers" 
                        className="cursor-pointer rounded-md data-[state=active]:bg-[#F24452] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                    >
                        🏢 Proveedores
                    </TabsTrigger>
                    <TabsTrigger 
                        value="supplies" 
                        className="cursor-pointer rounded-md data-[state=active]:bg-[#F24452] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                    >
                        📦 Insumos
                    </TabsTrigger>
                </TabsList>

                {/* Pestaña de Gastos */}
                <TabsContent value="expenses" className="space-y-4">
                    <ExpenseTable
                        expenses={expenses}
                        isLoading={expensesLoading}
                        onEdit={handleOpenExpenseForm}
                        onDelete={handleDeleteExpenseClick}
                        onView={handleViewExpense}
                    />
                </TabsContent>

                {/* Pestaña de Proveedores */}
                <TabsContent value="suppliers" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">Proveedores</h2>
                        <Button
                            onClick={() => handleOpenSupplierForm()}
                            className="bg-[#F24452] hover:bg-[#d93a48] text-white cursor-pointer"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Proveedor
                        </Button>
                    </div>
                    <SupplierTable
                        suppliers={suppliers}
                        isLoading={suppliersLoading}
                        onEdit={handleOpenSupplierForm}
                        onDelete={handleDeleteSupplierClick}
                    />
                </TabsContent>

                {/* Pestaña de Insumos */}
                <TabsContent value="supplies" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">Insumos</h2>
                        <Button
                            onClick={() => handleOpenSupplyForm()}
                            className="bg-[#F24452] hover:bg-[#d93a48] text-white cursor-pointer"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Insumo
                        </Button>
                    </div>
                    <SupplyTable
                        supplies={supplies}
                        onEdit={handleOpenSupplyForm}
                        onDelete={handleDeleteSupplyClick}
                    />
                </TabsContent>
            </Tabs>

            {/* Formulario de gasto */}
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
            />

            {/* Formulario de proveedor */}
            <SupplierForm
                open={isSupplierFormOpen}
                onOpenChange={(open) => {
                    setIsSupplierFormOpen(open);
                    if (!open) setEditingSupplier(null);
                }}
                onSubmit={handleSubmitSupplier}
                editingSupplier={editingSupplier || undefined}
            />

            {/* Formulario de insumo */}
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

            {/* Diálogo de detalle de gasto */}
            <ExpenseDetailsDialog
                open={!!viewingExpense}
                onOpenChange={(open) => !open && setViewingExpense(null)}
                expense={viewingExpense}
            />

            {/* Diálogo de confirmación de eliminación - Gastos */}
            <ConfirmDialog
                open={!!expenseToDelete}
                onOpenChange={(open) => !open && setExpenseToDelete(null)}
                onConfirm={handleConfirmDeleteExpense}
                title="Confirmar eliminación"
                description="¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer."
            />

            {/* Diálogo de confirmación de eliminación - Proveedores */}
            <ConfirmDialog
                open={!!supplierToDelete}
                onOpenChange={(open) => !open && setSupplierToDelete(null)}
                onConfirm={handleConfirmDeleteSupplier}
                title="Confirmar eliminación"
                description="¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer."
            />

            {/* Diálogo de confirmación de eliminación - Insumos */}
            <ConfirmDialog
                open={!!supplyToDelete}
                onOpenChange={(open) => !open && setSupplyToDelete(null)}
                onConfirm={handleConfirmDeleteSupply}
                title="Confirmar eliminación"
                description="¿Estás seguro de que deseas eliminar este insumo? Esta acción no se puede deshacer."
            />
        </div>
    );
}
