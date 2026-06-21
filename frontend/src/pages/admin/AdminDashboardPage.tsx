/**
 * Panel SuperAdmin: gestión de negocios y usuarios.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminService, type AdminBusiness, type AdminUser } from '../../services/admin.service';
import type { BusinessBillingStatus } from '../../services/me.service';
import { BillingBadge } from '@/components/admin/BillingBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
    Building2,
    Calendar,
    Loader2,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    UserCog,
    Users,
    X,
} from 'lucide-react';

const FIELD =
    'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-orange-500/20';

function formatDate(value: string | null) {
    if (!value) return '—';
    try {
        return new Date(value + 'T12:00:00').toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return value;
    }
}

function UserAvatar({ firstName, lastName }: { firstName: string; lastName: string }) {
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold text-white">
            {initials}
        </div>
    );
}

export default function AdminDashboardPage() {
    const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bizSearch, setBizSearch] = useState('');
    const [userSearch, setUserSearch] = useState('');

    const [bizOpen, setBizOpen] = useState(false);
    const [bizName, setBizName] = useState('');
    const [bizPlan, setBizPlan] = useState<BusinessBillingStatus>('GRATIS');
    const [bizExp, setBizExp] = useState('');
    const [bizSaving, setBizSaving] = useState(false);

    const [editBizOpen, setEditBizOpen] = useState(false);
    const [editBiz, setEditBiz] = useState<AdminBusiness | null>(null);
    const [editBizPlan, setEditBizPlan] = useState<BusinessBillingStatus>('GRATIS');
    const [editBizExp, setEditBizExp] = useState('');

    const [userOpen, setUserOpen] = useState(false);
    const [uEmail, setUEmail] = useState('');
    const [uFirst, setUFirst] = useState('');
    const [uLast, setULast] = useState('');
    const [uPass, setUPass] = useState('');
    const [userSaving, setUserSaving] = useState(false);

    const [roleOpen, setRoleOpen] = useState(false);
    const [roleUser, setRoleUser] = useState<AdminUser | null>(null);
    const [roleBid, setRoleBid] = useState('');
    const [roleType, setRoleType] = useState<'OWNER' | 'EMPLOYEE'>('EMPLOYEE');
    const [roleSaving, setRoleSaving] = useState(false);

    const [editUserOpen, setEditUserOpen] = useState(false);
    const [editUser, setEditUser] = useState<AdminUser | null>(null);
    const [editPass, setEditPass] = useState('');
    const [editSaving, setEditSaving] = useState(false);

    const refresh = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setLoading(true);
        try {
            const [b, u] = await Promise.all([AdminService.listBusinesses(), AdminService.listUsers()]);
            setBusinesses(b);
            setUsers(u);
        } catch (e) {
            toast.error('Error cargando datos de administración');
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const stats = useMemo(
        () => ({
            businesses: businesses.length,
            active: businesses.filter((b) => b.billingStatus === 'VIGENTE').length,
            overdue: businesses.filter((b) => ['MOROSO', 'VENCIDO'].includes(b.billingStatus)).length,
            users: users.filter((u) => !u.superAdmin).length,
        }),
        [businesses, users]
    );

    const filteredBusinesses = useMemo(() => {
        const q = bizSearch.trim().toLowerCase();
        if (!q) return businesses;
        return businesses.filter(
            (b) => b.name.toLowerCase().includes(q) || String(b.id).includes(q)
        );
    }, [businesses, bizSearch]);

    const filteredUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase();
        if (!q) return users;
        return users.filter(
            (u) =>
                u.email.toLowerCase().includes(q) ||
                u.firstName.toLowerCase().includes(q) ||
                u.lastName.toLowerCase().includes(q)
        );
    }, [users, userSearch]);

    const openCreateBiz = () => {
        setBizName('');
        setBizPlan('GRATIS');
        setBizExp('');
        setBizOpen(true);
    };

    const openEditBiz = (b: AdminBusiness) => {
        setEditBiz(b);
        setEditBizPlan(b.billingStatus);
        setEditBizExp(b.expiresAt ?? '');
        setEditBizOpen(true);
    };

    const handleCreateBiz = async () => {
        if (!bizName.trim()) {
            toast.error('Ingresá un nombre para el negocio');
            return;
        }
        setBizSaving(true);
        try {
            const payload: Parameters<typeof AdminService.createBusiness>[0] = { name: bizName.trim() };
            if (bizPlan !== 'GRATIS') {
                payload.billingStatus = bizPlan;
                payload.expiresAt = bizExp || null;
            } else {
                payload.billingStatus = 'GRATIS';
            }
            await AdminService.createBusiness(payload);
            toast.success('Negocio creado correctamente');
            setBizOpen(false);
            void refresh(true);
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Error al crear negocio');
        } finally {
            setBizSaving(false);
        }
    };

    const handleEditBiz = async () => {
        if (!editBiz) return;
        setBizSaving(true);
        try {
            const payload: Parameters<typeof AdminService.patchBusiness>[1] = {
                name: editBiz.name.trim(),
                billingStatus: editBizPlan,
            };
            if (editBizPlan !== 'GRATIS') {
                payload.expiresAt = editBizExp || null;
            } else {
                payload.expiresAt = null;
            }
            await AdminService.patchBusiness(editBiz.id, payload);
            toast.success('Negocio actualizado');
            setEditBizOpen(false);
            setEditBiz(null);
            void refresh(true);
        } catch {
            toast.error('Error al actualizar negocio');
        } finally {
            setBizSaving(false);
        }
    };

    const handleCreateUser = async () => {
        if (!uEmail.trim() || !uFirst.trim() || !uLast.trim() || !uPass) {
            toast.error('Completá todos los campos del usuario');
            return;
        }
        setUserSaving(true);
        try {
            await AdminService.createUser({
                email: uEmail.trim(),
                firstName: uFirst.trim(),
                lastName: uLast.trim(),
                password: uPass,
            });
            toast.success('Usuario creado correctamente');
            setUserOpen(false);
            setUEmail('');
            setUFirst('');
            setULast('');
            setUPass('');
            void refresh(true);
        } catch {
            toast.error('No se pudo crear el usuario');
        } finally {
            setUserSaving(false);
        }
    };

    const handleAssignRole = async () => {
        if (!roleUser || !roleBid) return;
        setRoleSaving(true);
        try {
            await AdminService.assignRole(roleUser.id, Number(roleBid), roleType);
            toast.success('Rol asignado');
            setRoleBid('');
            const updated = await AdminService.listUsers();
            setUsers(updated);
            setRoleUser(updated.find((u) => u.id === roleUser.id) ?? null);
        } catch {
            toast.error('No se pudo asignar el rol');
        } finally {
            setRoleSaving(false);
        }
    };

    const handleRemoveRole = async (userId: number, businessId: number) => {
        try {
            await AdminService.removeRole(userId, businessId);
            toast.success('Rol eliminado');
            const updated = await AdminService.listUsers();
            setUsers(updated);
            if (roleUser) {
                setRoleUser(updated.find((u) => u.id === roleUser.id) ?? null);
            }
            void refresh(true);
        } catch {
            toast.error('No se pudo eliminar el rol');
        }
    };

    const handleEditUser = async () => {
        if (!editUser) return;
        setEditSaving(true);
        try {
            await AdminService.patchUser(editUser.id, {
                firstName: editUser.firstName.trim(),
                lastName: editUser.lastName.trim(),
                password: editPass || undefined,
            });
            toast.success('Usuario actualizado');
            setEditUserOpen(false);
            setEditUser(null);
            setEditPass('');
            void refresh(true);
        } catch {
            toast.error('Error al actualizar usuario');
        } finally {
            setEditSaving(false);
        }
    };

    const openRoleDialog = (u: AdminUser) => {
        setRoleUser(u);
        setRoleBid('');
        setRoleType('EMPLOYEE');
        setRoleOpen(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                <p className="text-gray-500">Cargando panel de administración...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Centro de control
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Gestioná negocios, suscripciones y usuarios del sistema.
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="border-gray-300 bg-white hover:bg-gray-50"
                    onClick={() => void refresh(true)}
                    disabled={refreshing}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Negocios', value: stats.businesses, icon: Building2, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Suscripciones vigentes', value: stats.active, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Con deuda', value: stats.overdue, icon: Calendar, color: 'text-amber-600 bg-amber-50' },
                    { label: 'Usuarios tenant', value: stats.users, icon: Users, color: 'text-violet-600 bg-violet-50' },
                ].map((s) => (
                    <Card key={s.label} className="border-gray-200 bg-white shadow-sm">
                        <CardContent className="flex items-center gap-4 pt-6">
                            <div className={`rounded-xl p-3 ${s.color}`}>
                                <s.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                <p className="text-sm text-gray-500">{s.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="businesses" className="gap-6">
                <TabsList className="h-auto gap-1 bg-white p-1 shadow-sm border border-gray-200">
                    <TabsTrigger
                        value="businesses"
                        className="gap-2 px-4 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                    >
                        <Building2 className="h-4 w-4" />
                        Negocios
                    </TabsTrigger>
                    <TabsTrigger
                        value="users"
                        className="gap-2 px-4 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                    >
                        <Users className="h-4 w-4" />
                        Usuarios
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="businesses">
                    <Card className="border-gray-200 bg-white shadow-sm">
                        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-6">
                            <div>
                                <CardTitle className="text-xl">Negocios registrados</CardTitle>
                                <CardDescription>
                                    {filteredBusinesses.length} de {businesses.length} negocios
                                </CardDescription>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        placeholder="Buscar por nombre o ID..."
                                        value={bizSearch}
                                        onChange={(e) => setBizSearch(e.target.value)}
                                        className={`pl-9 w-full sm:w-64 ${FIELD}`}
                                    />
                                </div>
                                <Button
                                    onClick={openCreateBiz}
                                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20"
                                >
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    Nuevo negocio
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                                        <TableHead className="font-semibold text-gray-600">ID</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Nombre</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Estado</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Vencimiento</TableHead>
                                        <TableHead className="w-[100px]" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBusinesses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-gray-400">
                                                No hay negocios que coincidan con la búsqueda
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredBusinesses.map((b) => (
                                            <TableRow key={b.id} className="hover:bg-orange-50/30">
                                                <TableCell className="font-mono text-sm text-gray-500">
                                                    #{b.id}
                                                </TableCell>
                                                <TableCell className="font-medium text-gray-900">
                                                    {b.name}
                                                </TableCell>
                                                <TableCell>
                                                    <BillingBadge status={b.billingStatus} />
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    {formatDate(b.expiresAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                                                        onClick={() => openEditBiz(b)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users">
                    <Card className="border-gray-200 bg-white shadow-sm">
                        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-6">
                            <div>
                                <CardTitle className="text-xl">Usuarios del sistema</CardTitle>
                                <CardDescription>
                                    {filteredUsers.length} usuarios en total
                                </CardDescription>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        placeholder="Buscar por email o nombre..."
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        className={`pl-9 w-full sm:w-64 ${FIELD}`}
                                    />
                                </div>
                                <Button
                                    onClick={() => setUserOpen(true)}
                                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20"
                                >
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    Nuevo usuario
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                                        <TableHead className="font-semibold text-gray-600">Usuario</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Rol</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Negocios</TableHead>
                                        <TableHead className="w-[180px] font-semibold text-gray-600">
                                            Acciones
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-gray-400">
                                                No hay usuarios que coincidan con la búsqueda
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((u) => (
                                            <TableRow key={u.id} className="hover:bg-orange-50/30">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar
                                                            firstName={u.firstName}
                                                            lastName={u.lastName}
                                                        />
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {u.firstName} {u.lastName}
                                                            </p>
                                                            <p className="text-sm text-gray-500">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {u.superAdmin ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                                                            <ShieldCheck className="h-3 w-3" />
                                                            SuperAdmin
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-600">Usuario</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {u.superAdmin ? (
                                                        <span className="text-gray-400">—</span>
                                                    ) : u.businessRoles.length === 0 ? (
                                                        <span className="text-sm text-amber-600 font-medium">
                                                            Sin negocios asignados
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {u.businessRoles.map((r) => (
                                                                <span
                                                                    key={r.linkId}
                                                                    className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700"
                                                                >
                                                                    {r.businessName}
                                                                    <span className="ml-1 font-semibold text-orange-600">
                                                                        {r.role}
                                                                    </span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {!u.superAdmin && (
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-gray-300 bg-white hover:bg-gray-50"
                                                                onClick={() => {
                                                                    setEditUser(u);
                                                                    setEditPass('');
                                                                    setEditUserOpen(true);
                                                                }}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-gray-300 bg-white hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200"
                                                                onClick={() => openRoleDialog(u)}
                                                            >
                                                                <UserCog className="h-3.5 w-3.5 mr-1" />
                                                                Roles
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Nuevo negocio */}
            <Dialog open={bizOpen} onOpenChange={setBizOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Building2 className="h-5 w-5 text-orange-600" />
                            Nuevo negocio
                        </DialogTitle>
                        <DialogDescription>
                            Creá un negocio y configurá su plan de suscripción.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-1">
                        <div className="space-y-2">
                            <Label htmlFor="biz-name">Nombre del negocio</Label>
                            <Input
                                id="biz-name"
                                value={bizName}
                                onChange={(e) => setBizName(e.target.value)}
                                placeholder="Ej: Pizzeria Centro"
                                className={FIELD}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Plan</Label>
                            <Select
                                value={bizPlan}
                                onValueChange={(v) => setBizPlan(v as BusinessBillingStatus)}
                            >
                                <SelectTrigger className={`w-full ${FIELD}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="GRATIS">Gratis</SelectItem>
                                    <SelectItem value="VIGENTE">Vigente (pago)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {bizPlan !== 'GRATIS' && (
                            <div className="space-y-2">
                                <Label htmlFor="biz-exp">Fecha de vencimiento</Label>
                                <Input
                                    id="biz-exp"
                                    type="date"
                                    value={bizExp}
                                    onChange={(e) => setBizExp(e.target.value)}
                                    className={FIELD}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setBizOpen(false)} disabled={bizSaving}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateBiz}
                            disabled={bizSaving}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {bizSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear negocio'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Editar negocio */}
            <Dialog open={editBizOpen} onOpenChange={setEditBizOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Pencil className="h-5 w-5 text-orange-600" />
                            Editar negocio
                        </DialogTitle>
                        <DialogDescription>
                            Modificá los datos del negocio #{editBiz?.id}.
                        </DialogDescription>
                    </DialogHeader>
                    {editBiz && (
                        <div className="space-y-4 py-1">
                            <div className="space-y-2">
                                <Label htmlFor="edit-biz-name">Nombre</Label>
                                <Input
                                    id="edit-biz-name"
                                    value={editBiz.name}
                                    onChange={(e) => setEditBiz({ ...editBiz, name: e.target.value })}
                                    className={FIELD}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Estado de suscripción</Label>
                                <Select
                                    value={editBizPlan}
                                    onValueChange={(v) => setEditBizPlan(v as BusinessBillingStatus)}
                                >
                                    <SelectTrigger className={`w-full ${FIELD}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="GRATIS">Gratis</SelectItem>
                                        <SelectItem value="VIGENTE">Vigente</SelectItem>
                                        <SelectItem value="MOROSO">Moroso</SelectItem>
                                        <SelectItem value="VENCIDO">Vencido</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {editBizPlan !== 'GRATIS' && (
                                <div className="space-y-2">
                                    <Label htmlFor="edit-biz-exp">Vencimiento</Label>
                                    <Input
                                        id="edit-biz-exp"
                                        type="date"
                                        value={editBizExp}
                                        onChange={(e) => setEditBizExp(e.target.value)}
                                        className={FIELD}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setEditBizOpen(false)} disabled={bizSaving}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleEditBiz}
                            disabled={bizSaving}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {bizSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar cambios'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Nuevo usuario */}
            <Dialog open={userOpen} onOpenChange={setUserOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Users className="h-5 w-5 text-orange-600" />
                            Nuevo usuario
                        </DialogTitle>
                        <DialogDescription>
                            Creá un usuario tenant. Después podés asignarle roles en negocios.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-1">
                        <div className="space-y-2">
                            <Label htmlFor="u-email">Email</Label>
                            <Input
                                id="u-email"
                                type="email"
                                value={uEmail}
                                onChange={(e) => setUEmail(e.target.value)}
                                placeholder="usuario@ejemplo.com"
                                className={FIELD}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="u-first">Nombre</Label>
                                <Input
                                    id="u-first"
                                    value={uFirst}
                                    onChange={(e) => setUFirst(e.target.value)}
                                    className={FIELD}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="u-last">Apellido</Label>
                                <Input
                                    id="u-last"
                                    value={uLast}
                                    onChange={(e) => setULast(e.target.value)}
                                    className={FIELD}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="u-pass">Contraseña inicial</Label>
                            <Input
                                id="u-pass"
                                type="password"
                                value={uPass}
                                onChange={(e) => setUPass(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                className={FIELD}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setUserOpen(false)} disabled={userSaving}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateUser}
                            disabled={userSaving}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {userSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear usuario'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Editar usuario */}
            <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Pencil className="h-5 w-5 text-orange-600" />
                            Editar usuario
                        </DialogTitle>
                        <DialogDescription>{editUser?.email}</DialogDescription>
                    </DialogHeader>
                    {editUser && (
                        <div className="space-y-4 py-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-first">Nombre</Label>
                                    <Input
                                        id="edit-first"
                                        value={editUser.firstName}
                                        onChange={(e) =>
                                            setEditUser({ ...editUser, firstName: e.target.value })
                                        }
                                        className={FIELD}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-last">Apellido</Label>
                                    <Input
                                        id="edit-last"
                                        value={editUser.lastName}
                                        onChange={(e) =>
                                            setEditUser({ ...editUser, lastName: e.target.value })
                                        }
                                        className={FIELD}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-pass">Nueva contraseña</Label>
                                <Input
                                    id="edit-pass"
                                    type="password"
                                    value={editPass}
                                    onChange={(e) => setEditPass(e.target.value)}
                                    placeholder="Dejar vacío para no cambiar"
                                    className={FIELD}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setEditUserOpen(false)} disabled={editSaving}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleEditUser}
                            disabled={editSaving}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar cambios'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Roles */}
            <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <UserCog className="h-5 w-5 text-orange-600" />
                            Roles de {roleUser?.firstName}
                        </DialogTitle>
                        <DialogDescription>{roleUser?.email}</DialogDescription>
                    </DialogHeader>

                    {roleUser && (
                        <div className="space-y-6 py-1">
                            <div>
                                <p className="mb-2 text-sm font-medium text-gray-700">Roles actuales</p>
                                {roleUser.businessRoles.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                                        Este usuario no tiene negocios asignados.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {roleUser.businessRoles.map((r) => (
                                            <div
                                                key={r.linkId}
                                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {r.businessName}
                                                    </p>
                                                    <p className="text-xs text-orange-600 font-semibold">
                                                        {r.role}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => void handleRemoveRole(roleUser.id, r.businessId)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4 space-y-3">
                                <p className="text-sm font-medium text-gray-800">Asignar nuevo rol</p>
                                <div className="space-y-2">
                                    <Label>Negocio</Label>
                                    <Select value={roleBid} onValueChange={setRoleBid}>
                                        <SelectTrigger className={`w-full ${FIELD}`}>
                                            <SelectValue placeholder="Seleccionar negocio..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {businesses.map((b) => (
                                                <SelectItem key={b.id} value={String(b.id)}>
                                                    {b.name} (#{b.id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Rol</Label>
                                    <Select
                                        value={roleType}
                                        onValueChange={(v) => setRoleType(v as 'OWNER' | 'EMPLOYEE')}
                                    >
                                        <SelectTrigger className={`w-full ${FIELD}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="OWNER">Owner (dueño)</SelectItem>
                                            <SelectItem value="EMPLOYEE">Employee (empleado)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setRoleOpen(false)}>
                            Cerrar
                        </Button>
                        <Button
                            onClick={handleAssignRole}
                            disabled={roleSaving || !roleBid}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {roleSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Asignar rol'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
