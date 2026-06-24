# Arquitectura Técnica Responsive Frontend

## Audiencia

Documento para:

- Desarrolladores frontend/backend que impactan UI.
- Agentes de IA que deben extender o mantener el diseño responsive.
- Revisores técnicos y QA.

## Objetivo técnico

Estandarizar una arquitectura de UI que:

- Sea **mobile-first** por defecto.
- Mantenga paridad funcional con desktop.
- Escale sin duplicar lógica de negocio.
- Minimice regresiones visuales al agregar features.

---

## Resumen de implementación realizada

Se ejecutaron dos etapas:

1. **Base responsive global**
   - Utilities globales en `src/index.css`.
   - `DashboardLayout` con navegación móvil (header + bottom nav).
   - Páginas principales adaptadas (`Orders`, `Products`, `Customers`, `Expenses`, `Stats`, `History`, `Login`).
   - Patrón responsive tabla/card en listados.
   - Ajuste de `Dialog` base para pantallas chicas.

2. **Segunda pasada UX crítica**
   - Optimización mobile de flujos complejos:
     - `CreateOrderDialog`
     - `OrderDetailsDialog`
     - `OrderItemsEditor`
     - `OpenCashDialog`
     - `CloseCashDialog`
     - `ExpenseForm`
     - `ProductForm`
     - `CashShiftStatus`

---

## Principios de diseño técnico adoptados

## 1) Mobile-first real

- Base de estilos para viewport pequeño.
- Escalado progresivo con `sm/md/lg`.
- No depender de hover para acciones críticas.

## 2) Progressive enhancement

- Desktop conserva vistas densas (tabla/sidebar) cuando aporta productividad.
- Mobile usa cards y flujos simplificados para legibilidad y touch.

## 3) Paridad funcional

- La versión mobile no sacrifica operaciones críticas.
- Misma lógica de negocio, diferente presentación.

## 4) Componentes compartidos y consistencia

- Reutilización de `components/ui` (shadcn).
- Reglas comunes para `Dialog`, `Button`, `Input`, `Select`.

---

## Mapa de arquitectura responsive

## A) Capa global

- `frontend/src/index.css`
  - Utilidades agregadas:
    - `.app-page`
    - `.mobile-safe-bottom`
    - `.mobile-bottom-nav-offset`
    - `.touch-target`
  - Base visual y manejo de safe areas.

## B) Layout principal

- `frontend/src/layouts/DashboardLayout.tsx`
  - Desktop: sidebar persistente.
  - Mobile: header sticky + menú overlay + bottom nav fija.
  - Manejo de offsets para evitar solapamiento con navegación inferior.

## C) Patrón de datos visuales

- En desktop se mantiene tabla cuando aporta densidad.
- En mobile se usa card list para legibilidad y acciones táctiles.
- Aplicado en:
  - `ProductTable`
  - `CustomerTable`
  - `SupplierTable`
  - `SupplyTable`
  - `ExpenseTable`
  - `OrdersHistoryView`

## D) Diálogos y formularios complejos

- `frontend/src/components/ui/dialog.tsx`
  - `max-height` + `overflow-y-auto`.
  - Padding responsive.
- Formularios y modales críticos revisados con:
  - mayor altura de inputs y botones,
  - grillas que colapsan a 1 columna en mobile,
  - footer de acciones consistente.

---

## Decisiones clave por módulo

## Pedidos

- Kanban con scroll horizontal y snap en mobile.
- Detalle de pedido orientado a tareas: cobrar, editar ítems, ajustar entrega.
- Creación de pedido en layout responsive, priorizando velocidad operativa.

## Caja

- Estado de caja con bloques adaptativos y CTA visibles.
- Apertura/cierre con validaciones y lectura clara de diferencias.

## Catálogo/Clientes/Gastos

- Gestión orientada a cards en mobile.
- Formularios con targets táctiles adecuados y mejor jerarquía.

## Estadísticas/Historial

- Filtros con controles de altura consistente.
- Cards en mobile para reducir fricción de lectura.

---

## Convenciones para futuros cambios (dev + IA)

## Reglas de implementación

- Empezar por mobile y luego escalar.
- Para acciones primarias, usar `touch-target` o altura equivalente.
- Evitar tablas puras en mobile si hay más de 3 columnas relevantes.
- No introducir lógica de negocio en componentes presentacionales.
- Mantener textos de acción cortos y explícitos.

## Reglas de layout

- Contenedor de página: usar `.app-page` para consistencia.
- Formularios complejos: `grid-cols-1` en mobile, luego `sm:grid-cols-2`.
- Diálogos largos: validar scroll interno y footer visible.

## Reglas para agentes de IA

- Antes de tocar UI, revisar esta carpeta `docs/responsive-frontend`.
- Mantener paridad funcional (no ocultar features por responsive).
- Documentar cada cambio grande de UX en esta carpeta.
- Si se agrega un módulo nuevo, definir explícitamente:
  - navegación mobile,
  - vista de lista mobile,
  - estrategia de formularios/diálogos.

---

## Checklist de revisión para PR

- [ ] Se probó en viewport mobile (ancho ~360-430px).
- [ ] Acciones críticas disponibles sin zoom manual.
- [ ] Botones principales con área táctil cómoda.
- [ ] No hay desbordes horizontales no deseados.
- [ ] Diálogos largos scrolleables.
- [ ] Build frontend OK (`npm run build`).
- [ ] Sin lints nuevos en archivos tocados.

---

## Plan sugerido de evolución

## Fase 3 (recomendada)

- Microinteracciones de feedback (loading/success/error por acción).
- Refinamiento de estados vacíos por contexto operativo.
- Optimización de tiempos y cantidad de taps en tareas frecuentes.

## Fase 4 (escalabilidad)

- Diseño de tokens UI formales (spacing, radius, shadows).
- Auditoría de accesibilidad (contraste, foco, navegación teclado).
- Introducción de pruebas visuales/regresión responsive.
