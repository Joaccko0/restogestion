# Proyecto Pizzeria 1.0 - Contexto para futuras IA

Índice de documentación mantenida en el repo: [docs/README.md](./README.md) (arquitectura, API, setup, frontend, seguridad).

## Visión general
- Monorepo con backend Spring Boot (`backend/`) y frontend React + Vite + TypeScript + Tailwind/shadcn (`frontend/`).
- Objetivo: gestión de pedidos, combos, productos, clientes y direcciones, con creación de pedidos desde un modal amplio.

## Backend (Spring Boot)
- Punto de entrada: [backend/src/main/java/com/pizzeria/backend/BackendApplication.java](backend/src/main/java/com/pizzeria/backend/BackendApplication.java).
- Configuración: Maven (`pom.xml`), wrapper `mvnw`. Perfil/app config en [backend/src/main/resources/application.yaml](backend/src/main/resources/application.yaml) y artefacto compilado en `target/`.
- Paquetes principales esperados (revisar en árbol `com/pizzeria/backend`):
  - `auth/` (probable JWT/autenticación), `config/` (configuración), `controller/`, `dto/`, `mapper/`, `model/`, `repository/`, `service/`.
- Tests en [backend/src/test/java/com/pizzeria/backend](backend/src/test/java/com/pizzeria/backend).
- Para levantar local: PostgreSQL con `backend/docker-compose.yml` (contenedor `pizzeria_db`); stack prod en `docker-compose.yml` de la raíz; arranque conjunto con `start.ps1` / `start.bat` (Windows) o backend/frontend por separado.
- Migraciones SQL: `backend/migrations/` — ver [docs/MIGRATIONS.md](./MIGRATIONS.md).

## Frontend (React + Vite + Tailwind/shadcn)
- Entrada: [frontend/src/main.tsx](frontend/src/main.tsx), App en [frontend/src/App.tsx](frontend/src/App.tsx).
- Estilos: Tailwind config en [frontend/tailwind.config.ts](frontend/tailwind.config.ts), CSS base en [frontend/src/index.css](frontend/src/index.css) y [frontend/src/App.css](frontend/src/App.css).
- API client base: [frontend/src/api/client.ts](frontend/src/api/client.ts).
- Contextos: [frontend/src/context/AuthContext.tsx](frontend/src/context/AuthContext.tsx), [frontend/src/context/BusinessContext.tsx](frontend/src/context/BusinessContext.tsx) (carga `GET /api/me/businesses` y usa el primer negocio; `VITE_API_BASE_URL` en [frontend/src/api/client.ts](frontend/src/api/client.ts)).
- Hooks de datos: [frontend/src/hooks/useProducts.ts](frontend/src/hooks/useProducts.ts), [frontend/src/hooks/useCombos.ts](frontend/src/hooks/useCombos.ts), [frontend/src/hooks/useOrders.ts](frontend/src/hooks/useOrders.ts), [frontend/src/hooks/useSearch.ts](frontend/src/hooks/useSearch.ts).
- Servicios: [frontend/src/services/inventory.service.ts](frontend/src/services/inventory.service.ts), [frontend/src/services/order.service.ts](frontend/src/services/order.service.ts).
- Tipos: [frontend/src/types/inventory.types.ts](frontend/src/types/inventory.types.ts), [frontend/src/types/order.types.ts](frontend/src/types/order.types.ts), [frontend/src/types/auth.types.ts](frontend/src/types/auth.types.ts).
- Páginas: [frontend/src/pages/LoginPage.tsx](frontend/src/pages/LoginPage.tsx), [frontend/src/pages/RegisterPage.tsx](frontend/src/pages/RegisterPage.tsx), [frontend/src/pages/ProductsPage.tsx](frontend/src/pages/ProductsPage.tsx), [frontend/src/pages/OrdersPage.tsx](frontend/src/pages/OrdersPage.tsx).
- Layout: [frontend/src/layouts/DashboardLayout.tsx](frontend/src/layouts/DashboardLayout.tsx).
- Componentes clave UI (carrito/pedidos):
  - [frontend/src/components/CreateOrderDialog.tsx](frontend/src/components/CreateOrderDialog.tsx): modal para crear pedidos; ancho ajustable; columnas de productos/combos y carrito; selección de cliente/dirección via `CustomerAddressSelector`; métodos de pago/entrega en dos columnas; total al final.
  - [frontend/src/components/CustomerAddressSelector.tsx](frontend/src/components/CustomerAddressSelector.tsx): selector/creador de cliente y dirección (comportamiento similar para altas).
  - [frontend/src/components/OrderCard.tsx](frontend/src/components/OrderCard.tsx): tarjeta de pedido (rediseñada previamente).
  - Tablas/forms: [frontend/src/components/ProductTable.tsx](frontend/src/components/ProductTable.tsx), [frontend/src/components/ProductForm.tsx](frontend/src/components/ProductForm.tsx), [frontend/src/components/ComboTable.tsx](frontend/src/components/ComboTable.tsx), [frontend/src/components/ComboForm.tsx](frontend/src/components/ComboForm.tsx).
  - Kanban: [frontend/src/components/KanbanBoard.tsx](frontend/src/components/KanbanBoard.tsx) con columnas y tarjetas.
  - Diálogos de confirmación/detalle: [frontend/src/components/ConfirmDialog.tsx](frontend/src/components/ConfirmDialog.tsx), [frontend/src/components/OrderDetailsDialog.tsx](frontend/src/components/OrderDetailsDialog.tsx).
  - UI base (shadcn): [frontend/src/components/ui](frontend/src/components/ui) (buttons, dialog, inputs, selects, etc.).

## Flujos actuales relevantes
- Crear pedido:
  - Abrir `CreateOrderDialog` (botón según página). Modal ancho personalizado.
  - Columna izquierda: listas filtradas de productos/combos activos con botón "+" para agregar al carrito.
  - Columna derecha: carrito con cantidades editables, selección de pago y entrega (dos columnas), selección de cliente/dirección (abre `CustomerAddressSelector`), total al final.
  - Validaciones: requiere al menos un ítem; para delivery exige dirección seleccionada o manual.
  - Al confirmar `onSubmit`, vacía carrito y cierra si éxito.
- Selector de cliente/dirección:
  - Permite alternar lista y formulario de alta tanto para cliente como para dirección; al crear vuelve a la lista con la nueva opción seleccionada.

## Expenses & Inventory (Finanzas / Gestión de Gastos)

### Modelo de datos
Estructura de 4 entidades principales:

1. **Supplier** (Proveedor) - [backend/src/main/java/com/pizzeria/backend/model/Supplier.java](backend/src/main/java/com/pizzeria/backend/model/Supplier.java)
   - `id`, `businessId`, `createdAt`, `updatedAt` (heredado de `BaseEntity`)
   - `name`: Nombre del proveedor (ej: "Distribuidor X", "Telecom Y")
   - `contactInfo`: Información de contacto (teléfono, email, dirección)
   - Multi-tenant: cada negocio tiene sus propios proveedores

2. **Supply** (Insumo/Partida de Gasto) - [backend/src/main/java/com/pizzeria/backend/model/Supply.java](backend/src/main/java/com/pizzeria/backend/model/Supply.java)
   - `id`, `businessId`, `createdAt`, `updatedAt` (heredado de `BaseEntity`)
   - `name`: Nombre del insumo (ej: "Harina", "Internet", "Alquiler")
   - `category`: Enum `SupplyCategory` con valores:
     - `STOCK`: Insumos de producción (Harina, Queso, Tomate)
     - `SERVICE`: Servicios recurrentes (Internet, Gas, Teléfono)
     - `FIXED_COST`: Gastos fijos (Alquiler, Seguros)
   - Multi-tenant: cada negocio tiene sus propios insumos

3. **Expense** (Gasto/Expensa) - [backend/src/main/java/com/pizzeria/backend/model/Expense.java](backend/src/main/java/com/pizzeria/backend/model/Expense.java)
   - `id`, `businessId`, `createdAt`, `updatedAt` (heredado de `BaseEntity`)
   - `supplierId` (FK a Supplier, **Nullable**): Referencia al proveedor
     - Nullable para gastos sin proveedor externo (ej: Sueldos, gastos internos)
   - `date`: Fecha del gasto/factura
   - `total`: Total del gasto (BigDecimal con precision 10,2)
   - `items`: Colección de `ExpenseItem` (CascadeType.ALL, orphanRemoval=true)
   - Multi-tenant: cada negocio tiene sus propios gastos

4. **ExpenseItem** (Línea de Gasto) - [backend/src/main/java/com/pizzeria/backend/model/ExpenseItem.java](backend/src/main/java/com/pizzeria/backend/model/ExpenseItem.java)
   - `id`: PK simple (no hereda de BaseEntity, es tabla subordinada)
   - `expenseId` (FK a Expense, NOT NULL): Referencia al gasto padre
   - `supplyId` (FK a Supply, NOT NULL): Referencia al insumo/partida
   - `quantity`: Cantidad (Integer)
   - `unitPrice`: Precio unitario (BigDecimal con precision 10,2)
   - `subtotal`: Subtotal = quantity * unitPrice (BigDecimal con precision 10,2)

### DTOs y Mappers

**Supplier**:
- [backend/src/main/java/com/pizzeria/backend/dto/supplier/SupplierRequest.java](backend/src/main/java/com/pizzeria/backend/dto/supplier/SupplierRequest.java): Record con validación @NotBlank en name
- [backend/src/main/java/com/pizzeria/backend/dto/supplier/SupplierResponse.java](backend/src/main/java/com/pizzeria/backend/dto/supplier/SupplierResponse.java): Record con id, name, contactInfo
- [backend/src/main/java/com/pizzeria/backend/mapper/SupplierMapper.java](backend/src/main/java/com/pizzeria/backend/mapper/SupplierMapper.java): MapStruct mapper con métodos toResponse, toEntity, updateEntityFromRequest

**Supply**:
- [backend/src/main/java/com/pizzeria/backend/dto/supply/SupplyRequest.java](backend/src/main/java/com/pizzeria/backend/dto/supply/SupplyRequest.java): Record con @NotBlank name y @NotNull category
- [backend/src/main/java/com/pizzeria/backend/dto/supply/SupplyResponse.java](backend/src/main/java/com/pizzeria/backend/dto/supply/SupplyResponse.java): Record con id, name, category
- [backend/src/main/java/com/pizzeria/backend/mapper/SupplyMapper.java](backend/src/main/java/com/pizzeria/backend/mapper/SupplyMapper.java): MapStruct mapper

**Expense**:
- [backend/src/main/java/com/pizzeria/backend/dto/expense/ExpenseRequest.java](backend/src/main/java/com/pizzeria/backend/dto/expense/ExpenseRequest.java): Record con supplierId (nullable), @NotNull date, @NotEmpty items
- [backend/src/main/java/com/pizzeria/backend/dto/expense/ExpenseResponse.java](backend/src/main/java/com/pizzeria/backend/dto/expense/ExpenseResponse.java): Record con id, supplierId, supplierName, date, total (calculado), items
- [backend/src/main/java/com/pizzeria/backend/mapper/ExpenseMapper.java](backend/src/main/java/com/pizzeria/backend/mapper/ExpenseMapper.java): MapStruct mapper (items y supplier se mapean manualmente en Service)

**ExpenseItem**:
- [backend/src/main/java/com/pizzeria/backend/dto/expense/ExpenseItemRequest.java](backend/src/main/java/com/pizzeria/backend/dto/expense/ExpenseItemRequest.java): Record anidado en ExpenseRequest con supplyId, @Positive quantity, @Positive unitPrice
- [backend/src/main/java/com/pizzeria/backend/dto/expense/ExpenseItemResponse.java](backend/src/main/java/com/pizzeria/backend/dto/expense/ExpenseItemResponse.java): Record con id, supplyId, supplyName, quantity, unitPrice, subtotal
- [backend/src/main/java/com/pizzeria/backend/mapper/ExpenseItemMapper.java](backend/src/main/java/com/pizzeria/backend/mapper/ExpenseItemMapper.java): Mapper con método default toResponse (mapeo manual de supplyName)

### Servicios

1. **SupplierService** - [backend/src/main/java/com/pizzeria/backend/service/SupplierService.java](backend/src/main/java/com/pizzeria/backend/service/SupplierService.java)
   - Métodos CRUD: create, getAll, getById, update, delete
   - Método de búsqueda: searchSuppliersByName (por nombre, case-insensitive)
   - Control multi-tenant en todos los métodos

2. **SupplyService** - [backend/src/main/java/com/pizzeria/backend/service/SupplyService.java](backend/src/main/java/com/pizzeria/backend/service/SupplyService.java)
   - Métodos CRUD: create, getAll, getById, update, delete
   - Filtrado: getSuppliesByCategory (filtra por STOCK/SERVICE/FIXED_COST)
   - Búsqueda: searchSuppliesByName (por nombre, case-insensitive)
   - Control multi-tenant en todos los métodos

3. **ExpenseService** - [backend/src/main/java/com/pizzeria/backend/service/ExpenseService.java](backend/src/main/java/com/pizzeria/backend/service/ExpenseService.java)
   - Métodos CRUD: create, getAll, getById, update, delete
   - **Lógica especial en create/update**:
     - Valida que existan los Supplies referenciados en items
     - Calcula subtotal de cada item: quantity * unitPrice
     - Calcula total del gasto: suma de todos los subtotales
     - Maneja cascada de items (orphanRemoval)
   - Métodos especiales:
     - getExpensesByDateRange: rango de fechas (startDate a endDate inclusive)
     - getExpensesBySupplier: filtro por proveedor
   - Todos con validación multi-tenant

### Repositories

- [backend/src/main/java/com/pizzeria/backend/repository/SupplierRepository.java](backend/src/main/java/com/pizzeria/backend/repository/SupplierRepository.java): findByBusinessId, findByIdAndBusinessId, findByBusinessIdAndNameContainingIgnoreCase
- [backend/src/main/java/com/pizzeria/backend/repository/SupplyRepository.java](backend/src/main/java/com/pizzeria/backend/repository/SupplyRepository.java): findByBusinessId, findByIdAndBusinessId, findByBusinessIdAndCategory, findByBusinessIdAndNameContainingIgnoreCase
- [backend/src/main/java/com/pizzeria/backend/repository/ExpenseRepository.java](backend/src/main/java/com/pizzeria/backend/repository/ExpenseRepository.java): findByBusinessId, findByIdAndBusinessId, findByBusinessIdAndDateBetween, findByBusinessIdAndSupplierId, findByBusinessIdWithItems (custom query con LEFT JOIN FETCH para evitar N+1)
- [backend/src/main/java/com/pizzeria/backend/repository/ExpenseItemRepository.java](backend/src/main/java/com/pizzeria/backend/repository/ExpenseItemRepository.java): findByExpenseId, findBySupplyId

### Controllers

1. **SupplierController** - [backend/src/main/java/com/pizzeria/backend/controller/SupplierController.java](backend/src/main/java/com/pizzeria/backend/controller/SupplierController.java)
   - Base: `/api/suppliers`
   - Endpoints:
     - POST `/api/suppliers?businessId={id}` - Crear
     - GET `/api/suppliers?businessId={id}` - Listar todos
     - GET `/api/suppliers/{id}?businessId={id}` - Obtener uno
     - PUT `/api/suppliers/{id}?businessId={id}` - Editar
     - DELETE `/api/suppliers/{id}?businessId={id}` - Borrar
     - GET `/api/suppliers/search?businessId={id}&name={query}` - Buscar por nombre

2. **SupplyController** - [backend/src/main/java/com/pizzeria/backend/controller/SupplyController.java](backend/src/main/java/com/pizzeria/backend/controller/SupplyController.java)
   - Base: `/api/supplies`
   - Endpoints:
     - POST `/api/supplies?businessId={id}` - Crear
     - GET `/api/supplies?businessId={id}` - Listar todos
     - GET `/api/supplies/{id}?businessId={id}` - Obtener uno
     - PUT `/api/supplies/{id}?businessId={id}` - Editar
     - DELETE `/api/supplies/{id}?businessId={id}` - Borrar
     - GET `/api/supplies/category/{category}?businessId={id}` - Filtrar por categoría
     - GET `/api/supplies/search?businessId={id}&name={query}` - Buscar por nombre

3. **ExpenseController** - [backend/src/main/java/com/pizzeria/backend/controller/ExpenseController.java](backend/src/main/java/com/pizzeria/backend/controller/ExpenseController.java)
   - Base: `/api/expenses`
   - Endpoints:
     - POST `/api/expenses?businessId={id}` - Crear con items (calcula total automáticamente)
     - GET `/api/expenses?businessId={id}` - Listar todos
     - GET `/api/expenses/{id}?businessId={id}` - Obtener uno con items
     - PUT `/api/expenses/{id}?businessId={id}` - Editar (reemplaza items)
     - DELETE `/api/expenses/{id}?businessId={id}` - Borrar (en cascada con items)
     - GET `/api/expenses/date-range?businessId={id}&startDate={date}&endDate={date}` - Filtrar por rango
     - GET `/api/expenses/supplier/{supplierId}?businessId={id}` - Filtrar por proveedor

### Patrones y convenciones seguidas

- **Multi-tenant**: Todos los servicios validan `businessId` para control de acceso
- **DTOs y Mappers**: Separación clara entre entidades JPA y DTOs de transporte
- **Validaciones**: Anotaciones @Valid, @NotNull, @NotBlank, @Positive en DTOs
- **Transacciones**: @Transactional en servicios, con readOnly=true para queries
- **Cálculos**: El backend calcula subtotales y totales automáticamente (no confiar en el Front)
- **Relaciones**: CascadeType.ALL + orphanRemoval para integridad referencial en items
- **Comentarios**: Javadoc extenso en servicios y lógica compleja para facilitar mantenimiento

## Notas de diseño/UI
- El diálogo base en [frontend/src/components/ui/dialog.tsx](frontend/src/components/ui/dialog.tsx) ya no limita `sm:max-w-lg`; el ancho lo fijan las clases del consumidor (p. ej., `CreateOrderDialog`).
- Colores frecuentes: fondos beige `#F2EDE4`, bordes `#E5D9D1`, primario `#F24452` para CTAs.
- Grillas: se usan `grid-cols-2` en el modal para listas y opciones; scroll area fija en productos/combos.

## Cómo levantar
- Windows: `.\start.ps1` o `start.bat` desde la raíz (backend + frontend; logs en `%TEMP%`). Requiere JDK 21 (`scripts/JavaHome.ps1` opcional).
- Base de datos: `docker compose up -d` (raíz) antes del backend si usas el Postgres del compose.
- Frontend dev: `cd frontend && npm install && npm run dev` (Vite, puerto 5173).
- Backend dev: `cd backend && ./mvnw.cmd spring-boot:run` (Windows) o `./mvnw spring-boot:run` (Unix). Ver `application.yaml` y [SETUP_AND_RUN.md](./SETUP_AND_RUN.md).

## Preguntas abiertas / pendientes típicos
- Reglas de negocio completas de estados de pedido (revisar Kanban y API de orders).
- Autorización fina por rol (`OWNER`/`EMPLOYEE`) si hace falta más allá del filtro usuario ↔ `businessId`.
- Deploy/config de base de datos: [SETUP_AND_RUN.md](./SETUP_AND_RUN.md), perfil `prod`, `docker-compose.yml` (raíz), `application.yaml`.
- Endpoints y contratos: [API_REFERENCE.md](./API_REFERENCE.md) y paquete `dto` en backend.

## Tip para futuras IA
- Mantener consistencia de colores y anchos en modales; el ancho depende de las clases pasadas a `DialogContent`.
- Si cambias comportamientos de selección (cliente/dirección), alinear con `CustomerAddressSelector` para no romper el flujo de creación de pedidos.
- Evita sobreescribir estilos base de shadcn en `ui/` salvo necesidad puntual (ya se eliminó el límite de `max-w` del dialog).
- Para Expenses & Inventory: el backend calcula automáticamente subtotales y totales. El Front **NO debe** hacer estos cálculos; confía en lo que retorna el API.
- Al crear un Expense, los items se reemplazan completamente (no es merge). Si el usuario edita un gasto, envía todos los items que desea (nuevos, modificados o que se mantienen).
- Los Suppliers pueden usarse en múltiples Expenses. Los Supplies también. No implementar borrado lógico aún, pero tenerlo en cuenta para futuras iteraciones si hay restricciones de integridad.
- Usar `businessId` como query param en todos los endpoints (eventual migración a JWT token con extracción automática en futuro).
