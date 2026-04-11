/**
 * Panel SuperAdmin: negocios y usuarios.
 */
import { useCallback, useEffect, useState } from 'react';
import { AdminService, type AdminBusiness, type AdminUser } from '../../services/admin.service';
import type { BusinessBillingStatus } from '../../services/me.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
    const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    const [bizOpen, setBizOpen] = useState(false);
    const [bizName, setBizName] = useState('');
    const [bizPlan, setBizPlan] = useState<BusinessBillingStatus>('GRATIS');
    const [bizExp, setBizExp] = useState('');

    const [userOpen, setUserOpen] = useState(false);
    const [uEmail, setUEmail] = useState('');
    const [uFirst, setUFirst] = useState('');
    const [uLast, setULast] = useState('');
    const [uPass, setUPass] = useState('');

    const [roleOpen, setRoleOpen] = useState(false);
    const [roleUserId, setRoleUserId] = useState<number | null>(null);
    const [roleBid, setRoleBid] = useState('');
    const [roleType, setRoleType] = useState<'OWNER' | 'EMPLOYEE'>('EMPLOYEE');

    const [editUserOpen, setEditUserOpen] = useState(false);
    const [editUser, setEditUser] = useState<AdminUser | null>(null);
    const [editPass, setEditPass] = useState('');

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const [b, u] = await Promise.all([AdminService.listBusinesses(), AdminService.listUsers()]);
            setBusinesses(b);
            setUsers(u);
        } catch (e) {
            toast.error('Error cargando datos de administración');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const handleCreateBiz = async () => {
        try {
            const payload: Parameters<typeof AdminService.createBusiness>[0] = { name: bizName };
            if (bizPlan !== 'GRATIS') {
                payload.billingStatus = bizPlan;
                payload.expiresAt = bizExp || null;
            } else {
                payload.billingStatus = 'GRATIS';
            }
            await AdminService.createBusiness(payload);
            toast.success('Negocio creado');
            setBizOpen(false);
            setBizName('');
            setBizPlan('GRATIS');
            setBizExp('');
            void refresh();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Error al crear negocio');
        }
    };

    const handleCreateUser = async () => {
        try {
            await AdminService.createUser({
                email: uEmail,
                firstName: uFirst,
                lastName: uLast,
                password: uPass,
            });
            toast.success('Usuario creado');
            setUserOpen(false);
            setUEmail('');
            setUFirst('');
            setULast('');
            setUPass('');
            void refresh();
        } catch {
            toast.error('No se pudo crear el usuario');
        }
    };

    const handleAssignRole = async () => {
        if (roleUserId == null || !roleBid) return;
        try {
            await AdminService.assignRole(roleUserId, Number(roleBid), roleType);
            toast.success('Rol asignado');
            setRoleOpen(false);
            setRoleUserId(null);
            setRoleBid('');
            void refresh();
        } catch {
            toast.error('No se pudo asignar el rol');
        }
    };

    const handleEditUser = async () => {
        if (!editUser) return;
        try {
            await AdminService.patchUser(editUser.id, {
                firstName: editUser.firstName,
                lastName: editUser.lastName,
                password: editPass || undefined,
            });
            toast.success('Usuario actualizado');
            setEditUserOpen(false);
            setEditUser(null);
            setEditPass('');
            void refresh();
        } catch {
            toast.error('Error al actualizar usuario');
        }
    };

    if (loading && businesses.length === 0 && users.length === 0) {
        return <p className="text-gray-600">Cargando...</p>;
    }

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Negocios</h1>
                <Button onClick={() => setBizOpen(true)} className="mb-4 bg-orange-600 hover:bg-orange-700">
                    Nuevo negocio
                </Button>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Vencimiento</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {businesses.map((b) => (
                            <TableRow key={b.id}>
                                <TableCell>{b.id}</TableCell>
                                <TableCell>{b.name}</TableCell>
                                <TableCell>{b.billingStatus}</TableCell>
                                <TableCell>{b.expiresAt ?? '—'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Usuarios</h2>
                <Button onClick={() => setUserOpen(true)} className="mb-4 bg-orange-600 hover:bg-orange-700">
                    Nuevo usuario
                </Button>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>SuperAdmin</TableHead>
                            <TableHead>Negocios</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                    {u.firstName} {u.lastName}
                                </TableCell>
                                <TableCell>{u.superAdmin ? 'Sí' : 'No'}</TableCell>
                                <TableCell className="max-w-xs truncate">
                                    {u.businessRoles.map((r) => `${r.businessName} (${r.role})`).join(', ') || '—'}
                                </TableCell>
                                <TableCell>
                                    {!u.superAdmin && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mr-2"
                                                onClick={() => {
                                                    setEditUser(u);
                                                    setEditPass('');
                                                    setEditUserOpen(true);
                                                }}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setRoleUserId(u.id);
                                                    setRoleOpen(true);
                                                }}
                                            >
                                                Rol
                                            </Button>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={bizOpen} onOpenChange={setBizOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo negocio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>Nombre</Label>
                            <Input value={bizName} onChange={(e) => setBizName(e.target.value)} />
                        </div>
                        <div>
                            <Label>Plan</Label>
                            <select
                                className="w-full border rounded-md p-2"
                                value={bizPlan}
                                onChange={(e) => setBizPlan(e.target.value as BusinessBillingStatus)}
                            >
                                <option value="GRATIS">GRATIS</option>
                                <option value="VIGENTE">VIGENTE (pago)</option>
                            </select>
                        </div>
                        {bizPlan !== 'GRATIS' && (
                            <div>
                                <Label>Fecha fin (YYYY-MM-DD)</Label>
                                <Input type="date" value={bizExp} onChange={(e) => setBizExp(e.target.value)} />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBizOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateBiz}>Crear</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={userOpen} onOpenChange={setUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo usuario</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>Email</Label>
                            <Input value={uEmail} onChange={(e) => setUEmail(e.target.value)} type="email" />
                        </div>
                        <div>
                            <Label>Nombre</Label>
                            <Input value={uFirst} onChange={(e) => setUFirst(e.target.value)} />
                        </div>
                        <div>
                            <Label>Apellido</Label>
                            <Input value={uLast} onChange={(e) => setULast(e.target.value)} />
                        </div>
                        <div>
                            <Label>Contraseña inicial</Label>
                            <Input
                                value={uPass}
                                onChange={(e) => setUPass(e.target.value)}
                                type="password"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateUser}>Crear</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Asignar rol en negocio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>ID Negocio</Label>
                            <Input value={roleBid} onChange={(e) => setRoleBid(e.target.value)} />
                        </div>
                        <div>
                            <Label>Rol</Label>
                            <select
                                className="w-full border rounded-md p-2"
                                value={roleType}
                                onChange={(e) => setRoleType(e.target.value as 'OWNER' | 'EMPLOYEE')}
                            >
                                <option value="OWNER">OWNER</option>
                                <option value="EMPLOYEE">EMPLOYEE</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAssignRole}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar usuario</DialogTitle>
                    </DialogHeader>
                    {editUser && (
                        <div className="space-y-3">
                            <div>
                                <Label>Nombre</Label>
                                <Input
                                    value={editUser.firstName}
                                    onChange={(e) =>
                                        setEditUser({ ...editUser, firstName: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Apellido</Label>
                                <Input
                                    value={editUser.lastName}
                                    onChange={(e) =>
                                        setEditUser({ ...editUser, lastName: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Nueva contraseña (opcional)</Label>
                                <Input
                                    value={editPass}
                                    onChange={(e) => setEditPass(e.target.value)}
                                    type="password"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditUserOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEditUser}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
