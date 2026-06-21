# AGENTS.md — Contexto del proyecto Pizzeria

Este archivo es la **entrada principal para agentes de IA** (Cursor, etc.) antes de tocar código.
Documentación extendida en [`docs/`](docs/README.md).

---

## Qué es este proyecto

Sistema SaaS multi-tenant para gestionar **pizzerías**: pedidos (Kanban), catálogo, clientes, turnos de caja, gastos, panel SuperAdmin y facturación por negocio.

**Monorepo:**

| Carpeta | Stack | Puerto dev |
|---------|-------|------------|
| `backend/` | Spring Boot 3.5, Java 21, JPA, PostgreSQL, JWT | `8080` |
| `frontend/` | React 19, TypeScript, Vite 7, Tailwind 4, shadcn/ui | `5173` |

---

## Arranque rápido

```bash
# 1. Base de datos (Docker dev — backend/docker-compose.yml)
cd backend && docker compose up -d

# 2. Todo junto (Windows)
.\start.ps1

# 3. O por separado
cd backend && ./mvnw.cmd spring-boot:run
cd frontend && npm install && npm run dev
```

**Credenciales dev (perfil default, no `prod`):**

| Usuario | Email | Password | Uso |
|---------|-------|----------|-----|
| Demo tenant | `owner@pizzeria.local` | `password123` | Negocio "Pizzeria Demo" |
| SuperAdmin | `superadmin@pizzeria.local` | `superadmin123` | Panel `/admin` |

El `businessId` real lo obtiene el frontend con `GET /api/me/businesses` tras login.

**Producción (`SPRING_PROFILES_ACTIVE=prod`):** no hay usuarios demo ni SuperAdmin automático. Consultar o crear SuperAdmin en BD — ver [`docs/SETUP_AND_RUN.md`](docs/SETUP_AND_RUN.md#superadmin-producción).

Variables clave: ver [`docs/SETUP_AND_RUN.md`](docs/SETUP_AND_RUN.md).

---

## Arquitectura

```
React SPA ──JSON+JWT──► Spring Boot /api/* ──JDBC──► PostgreSQL
```

**Backend — capas** (`com.pizzeria.backend`):

| Capa | Paquete | Rol |
|------|---------|-----|
| HTTP | `controller/` | REST, `@Valid` |
| Negocio | `service/` | Reglas, `@Transactional` |
| Datos | `repository/` | Spring Data JPA |
| Modelo | `model/` | Entidades JPA |
| Contratos | `dto/` | Records request/response |
| Mapeo | `mapper/` | MapStruct |

**Frontend — capas:**

| Capa | Ubicación | Rol |
|------|-----------|-----|
| Rutas | `App.tsx` | React Router 7 |
| Estado global | `context/` | `AuthContext`, `BusinessContext` |
| Datos | `hooks/` + `services/` | Llamadas API |
| UI | `pages/`, `components/`, `components/ui/` | Pantallas y shadcn |

---

## Seguridad y multi-tenant (CRÍTICO)

Leer [`docs/AUTH_AND_MULTITENANCY.md`](docs/AUTH_AND_MULTITENANCY.md) antes de cambiar auth o endpoints.

1. **JWT stateless** — header `Authorization: Bearer <token>`. Token en `localStorage` (`jwt_token`).
2. **`businessId` obligatorio** en casi todos los endpoints tenant (query param). Sin él → **400**. Usuario sin rol en ese negocio → **403** (`BusinessScopeFilter`).
3. **Excepciones sin `businessId`:** `/api/auth/**`, `/api/me/**`, `/api/admin/**`.
4. **SuperAdmin** (`super_admin = true`): accede a `/api/admin/**`, no opera con `businessId`.
5. **Registro público deshabilitado** — `POST /api/auth/register` → 404.
6. **Facturación SaaS:** negocios con `billingStatus` (GRATIS, VIGENTE, MOROSO, VENCIDO). Si VENCIDO, `SubscriptionAccessFilter` limita operaciones.
7. **Roles `OWNER`/`EMPLOYEE` existen pero no restringen endpoints** aún — cualquier usuario con acceso al negocio puede usar la API.

Al agregar endpoints tenant: incluir `businessId` en query y validar pertenencia vía `BusinessAccessService`.

---

## Módulos funcionales

### Pedidos y Kanban
- Entidades: `Order`, `OrderItem`, `OrderPayment`. Estados: `PENDING → PREPARING → READY → DELIVERED | CANCELLED`.
- **Requiere caja abierta** (`CashShift`) para crear pedidos.
- `GET /api/orders` → pedidos del turno abierto. `GET /api/orders/historic` → histórico.
- **Editar ítems** en pedido abierto: `PATCH /api/orders/{id}/details` (`items[]`). En **DELIVERED** solo lectura.
- **Pago dividido**: `payments[]` en el mismo PATCH; agregación en cierre de caja y stats (`frontend/src/lib/orderPayments.ts`).
- UI: `OrdersPage`, `KanbanBoard`, `CreateOrderDialog`, `OrderCard`, `OrderDetailsDialog`, `OrderItemsEditor`.

### Turnos de caja (CashShift)
- Una sola caja **OPEN** por negocio. Pedidos se vinculan al turno activo (no desaparecen a medianoche).
- UI: `CashShiftStatus`, `OpenCashDialog`, `CloseCashDialog` en tablero de pedidos.
- Detalle: [`docs/CASHSHIFT_ARCHITECTURE.md`](docs/CASHSHIFT_ARCHITECTURE.md).

### Catálogo
- `Product` (categoría **obligatoria**), `Combo`, `ComboItem`, `MenuCategory`.
- CRUD: `/api/products`, `/api/combos`, `/api/menu-categories`.
- Categorías por defecto al listar: Pizzas, Empanadas, Bebidas, Otros (`MenuCategoryService`).
- UI: `ProductsPage` (pestañas Productos / Combos / **Categorías**), `ProductTable`, `ComboTable`.

### Clientes y direcciones
- `Customer`, `Address`. Direcciones anidadas bajo `/api/customers/{id}/addresses`.
- UI: `CustomersPage`, `CustomerAddressSelector` (usado al crear pedidos).

### Gastos (Expenses)
- `Supplier`, `Supply` (categorías: STOCK, SERVICE, FIXED_COST), `Expense`, `ExpenseItem`.
- **El backend calcula subtotales y totales** — el frontend NO debe sumar.
- Al editar un gasto, enviar **todos** los items (reemplazo completo, no merge).
- UI: `ExpensesPage`, `ExpenseForm`, `ExpenseTable`.

### Admin SaaS
- Backend: `AdminBusinessController`, `AdminUserController` bajo `/api/admin/**`.
- Frontend: `/admin` → `AdminDashboardPage` (SuperAdmin).
- Servicio: `frontend/src/services/admin.service.ts`.

---

## Convenciones de código

### Backend
- Entidades multi-tenant extienden `BaseEntity` (`id`, `businessId`, timestamps).
- DTOs como Java records con validación Jakarta (`@NotNull`, `@NotBlank`, etc.).
- MapStruct en `mapper/`; lógica compleja (totales, cascadas) en `service/`.
- Errores centralizados en `GlobalExceptionHandler`.
- Dev: `ddl-auto: update`. Prod: `ddl-auto: validate` — esquema debe existir.
- Migraciones SQL en `backend/migrations/` — idempotentes; en prod se aplican con [`scripts/run-migrations.sh`](../scripts/run-migrations.sh) (automático en deploy a `main`). Ver [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md).

### Frontend
- Cliente HTTP: `frontend/src/api/client.ts` — base URL vía `VITE_API_BASE_URL` o `http://localhost:8080/api`.
- Interceptor 401 → limpia token y redirige a `/login`.
- `BusinessContext` usa el **primer** negocio de `/api/me/businesses` (piloto un solo cliente).
- Componentes UI base en `components/ui/` (shadcn) — evitar cambios globales innecesarios.
- Alias `@/` → `src/`.

### UI / diseño
- Colores frecuentes: fondo `#F2EDE4`, bordes `#E5D9D1`, primario `#F24452`.
- Modales anchos: el ancho lo define el consumidor en `DialogContent`, no el componente base.
- Notificaciones: `sonner` (`Toaster` en `App.tsx`).

---

## Mapa de archivos clave

### Backend
```
backend/src/main/java/com/pizzeria/backend/
├── BackendApplication.java
├── auth/                    # AuthController, AuthenticationService
├── config/                  # SecurityConfig, JwtService, filtros
├── controller/              # REST (Product, Order, CashShift, Expense, Admin…)
├── service/                 # Lógica de negocio
├── repository/              # JPA
├── model/                   # Entidades + enums/
├── dto/                     # Records por dominio
└── mapper/                  # MapStruct
```

Controllers existentes: `Product`, `Combo`, `MenuCategory`, `Customer`, `Address`, `Order`, `CashShift`, `Supplier`, `Supply`, `Expense`, `Me`, `AdminBusiness`, `AdminUser`.

### Frontend
```
frontend/src/
├── App.tsx                  # Rutas
├── api/client.ts            # Axios + JWT
├── context/                 # AuthContext, BusinessContext
├── hooks/                   # useOrders, useProducts, useCashShift, useExpenses…
├── services/                # *.service.ts por dominio
├── types/                   # *.types.ts por dominio
├── pages/                   # LoginPage, OrdersPage, ExpensesPage, admin/…
├── layouts/                 # DashboardLayout, AdminLayout
└── components/              # KanbanBoard, CreateOrderDialog, CashShift*, ui/
```

### Rutas frontend
| Ruta | Página |
|------|--------|
| `/login` | Login |
| `/admin` | Panel SuperAdmin |
| `/dashboard` | Redirect tenant (→ pedidos) |
| `/dashboard/history` | Histórico pedidos |
| `/dashboard/stats` | Estadísticas |
| `/dashboard/products` | Productos y combos |
| `/dashboard/customers` | Clientes |
| `/dashboard/expenses` | Gastos |

---

## API — resumen

Prefijo: `/api`. Referencia completa: [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md).

Patrón tenant: `GET/POST/PUT/DELETE /api/{recurso}?businessId={id}`

Grupos principales: `/auth`, `/me`, `/admin`, `/products`, `/combos`, `/menu-categories`, `/customers`, `/orders`, `/cash-shifts`, `/suppliers`, `/supplies`, `/expenses`.

---

## Qué NO hacer

- No omitir `businessId` en endpoints tenant.
- No calcular totales de gastos en el frontend.
- No asumir que el registro público funciona (está deshabilitado).
- No resetear estilos base de shadcn en `components/ui/` sin necesidad.
- No crear usuarios demo en perfil `prod` (`HardcodedUserDataLoader` y `SuperAdminDataLoader` solo en dev).
- No hacer cambios amplios fuera del scope pedido — el proyecto prioriza difs mínimos y convenciones existentes.

---

## Documentación por tema

| Tema | Archivo |
|------|---------|
| Índice general | [`docs/README.md`](docs/README.md) |
| Instalación | [`docs/SETUP_AND_RUN.md`](docs/SETUP_AND_RUN.md) |
| Arquitectura | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Modelo de dominio | [`docs/DOMAIN_MODEL.md`](docs/DOMAIN_MODEL.md) |
| API REST | [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) |
| Auth / multi-tenant | [`docs/AUTH_AND_MULTITENANCY.md`](docs/AUTH_AND_MULTITENANCY.md) |
| Frontend | [`docs/FRONTEND.md`](docs/FRONTEND.md) |
| CashShift | [`docs/CASHSHIFT_ARCHITECTURE.md`](docs/CASHSHIFT_ARCHITECTURE.md) |
| Migraciones BD / deploy | [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md) |
| Contexto detallado gastos/UI | [`docs/ai-context.md`](docs/ai-context.md) |

---

## Checklist antes de implementar

1. ¿Afecta multi-tenant? → validar `businessId` y filtros de seguridad.
2. ¿Nuevo endpoint? → seguir patrón controller → service → repository + DTO + mapper.
3. ¿Nueva pantalla? → ruta en `App.tsx`, hook + service, usar `BusinessContext` para el id.
4. ¿Cálculos monetarios? → siempre en backend (`BigDecimal`).
5. ¿Pedidos? → verificar flujo de caja abierta; ítems editables solo si no está `DELIVERED`.
6. ¿Cambio de esquema JPA? → nueva migración en `backend/migrations/` + probar script.
7. Compilar: `cd backend && ./mvnw.cmd clean compile` y `cd frontend && npm run build`.
