# Guía del frontend

## Stack

- **React 19** + **TypeScript**
- **Vite 7** como bundler y servidor de desarrollo
- **React Router 7** para rutas
- **Axios** (`src/api/client.ts`) con interceptores JWT
- **Tailwind CSS 4** + componentes en `src/components/ui/` (patrón shadcn)
- Notificaciones: **sonner** (`Toaster` en `App.tsx`)

## Rutas

Definidas en `App.tsx`:

| Ruta | Componente | Notas |
|------|------------|--------|
| `/login` | `LoginPage` | Pública |
| `/register` | `RegisterPage` | Pública |
| `/dashboard` | `OrdersPage` (índice del layout) | Protegida |
| `/dashboard/history` | `OrdersHistoryPage` | Protegida |
| `/dashboard/stats` | `StatsPage` | Protegida |
| `/dashboard/products` | `ProductsPage` | Protegida |
| `/dashboard/customers` | `CustomersPage` | Protegida |
| `/dashboard/expenses` | `ExpensesPage` | Protegida |
| `*` | Redirección a `/dashboard` | |

`ProtectedRoute` envuelve el layout y exige `isAuthenticated` del `AuthContext`.

## Contextos

- **`AuthContext`**: login, logout, token en `localStorage`, estado autenticado.
- **`BusinessContext`**: tras autenticación, llama a `GET /api/me/businesses` (`MeService`) y fija el negocio actual como **primer elemento** de la lista (piloto un solo cliente). Si la lista está vacía (p. ej. usuario sin roles), `currentBusiness` queda `null`.

## Cliente HTTP

- Archivo: `frontend/src/api/client.ts`
- **`baseURL`**: variable de entorno **`VITE_API_BASE_URL`** si está definida; si no, `http://localhost:8080/api`. Ver [frontend/.env.example](../frontend/.env.example).
- Añade `Authorization: Bearer` si hay token
- Manejo de 401 global

## Áreas funcionales (referencia de archivos)

| Área | Hooks / servicios / páginas típicos |
|------|-------------------------------------|
| Pedidos | `useOrders`, `order.service`, `OrdersPage`, `KanbanBoard`, `CreateOrderDialog` |
| Historial | `OrdersHistoryPage` |
| Productos / combos | `useProducts`, `useCombos`, `inventory.service`, `ProductsPage` |
| Clientes | `useCustomers`, `CustomersPage`, `CustomerAddressSelector` |
| Gastos | Página `ExpensesPage` y servicios asociados |
| Caja | `useCashShift`, `cashshift.service`, componentes CashShift en pedidos |
| Negocio actual | `me.service`, `BusinessContext` |

## UI y estilo

- Layout principal: `layouts/DashboardLayout.tsx` (sidebar, navegación, logout).
- Colores y patrones visuales descritos en [ai-context.md](./ai-context.md) (sección diseño).

## Documentación específica CashShift

La integración UI de turnos de caja en el tablero de pedidos está documentada en [FRONTEND_SUMMARY.md](./FRONTEND_SUMMARY.md) y [INDEX_OF_CHANGES.md](./INDEX_OF_CHANGES.md).

## Build

```bash
cd frontend
npm run build
```

Ejecuta `tsc -b` y `vite build`. El servidor de desarrollo es `npm run dev` (puerto 5173 por defecto).

Para producción, define `VITE_API_BASE_URL` antes de `npm run build` para empaquetar la URL correcta del API.
