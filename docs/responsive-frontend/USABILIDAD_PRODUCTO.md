# Usabilidad del Producto (Modo Mobile)

## Para quién es esta guía

Esta guía está orientada a:

- Dueños y encargados que controlan el negocio desde el celular.
- Empleados que operan pedidos/caja desde teléfono o tablet chica.
- Equipo interno que necesita validar experiencia real de uso móvil.

## Qué cambió en la experiencia mobile

El frontend ahora sigue un enfoque **mobile-first**:

- Navegación inferior fija para accesos rápidos.
- Header mobile simplificado con contexto de negocio activo.
- Controles táctiles con mejor tamaño (44px+ en acciones clave).
- Tablas complejas convertidas en **cards** en celular.
- Diálogos/formularios adaptados a alto/scroll de pantalla chica.
- Mejor jerarquía visual para decisiones rápidas en operación.

---

## Flujo recomendado diario (dueño/encargado)

1. **Login desde celular**
   - Entrar a `/login`.
   - Ingresar credenciales.
   - El formulario está optimizado para teclado/autocomplete móvil.

2. **Control de pedidos en tiempo real**
   - Ir a `Pedidos` desde la navegación inferior.
   - Revisar columnas del Kanban (deslizables horizontalmente).
   - Abrir detalle de pedido y ejecutar acciones de cobro/edición.

3. **Control de caja**
   - Ver estado de caja en la parte superior de pedidos.
   - Abrir/cerrar caja con diálogos optimizados para touch.
   - Cargar resumen manual al cierre cuando corresponda.

4. **Supervisión comercial**
   - Revisar `Estadísticas` para ventas, gastos y balance neto.
   - Consultar `Historial` con filtros por fecha/estado/pago.

5. **Mantenimiento operativo**
   - Editar `Productos` y `Combos`.
   - Actualizar `Clientes` y direcciones.
   - Registrar `Gastos`, proveedores e insumos.

---

## Guía rápida por módulo

## 1) Pedidos

- **Qué podés hacer**
  - Crear pedido.
  - Mover estado del pedido en Kanban.
  - Cobrar pedido.
  - Editar ítems y datos de entrega en detalle.

- **Tips de uso mobile**
  - En Kanban, deslizar horizontal para cambiar de columna.
  - Usar cards para lectura rápida (cliente, total, estado).
  - Priorizar botones primarios (`Cobrar`, `Crear pedido`) desde el pulgar.

## 2) Productos y combos

- **Qué podés hacer**
  - Buscar y filtrar productos.
  - Alta/edición/baja de productos/combos.
  - Gestión de categorías.

- **Tips de uso mobile**
  - Usar pestañas superiores y cards para edición rápida.
  - Validar categoría obligatoria antes de guardar.

## 3) Clientes

- **Qué podés hacer**
  - Alta y edición de clientes.
  - Gestión de direcciones.

- **Tips de uso mobile**
  - Aprovechar cards para identificar cliente/teléfono rápido.
  - Direcciones accesibles desde botón dedicado por cliente.

## 4) Gastos

- **Qué podés hacer**
  - Registrar gasto con múltiples ítems.
  - Gestionar proveedores e insumos.

- **Tips de uso mobile**
  - Completar primero proveedor/fecha.
  - Cargar ítems en bloque y revisar total antes de confirmar.

## 5) Estadísticas e historial

- **Qué podés hacer**
  - Filtrar por rango de fechas.
  - Ver distribución de ventas, medios de pago y topes.
  - Auditar historial de pedidos con filtros.

- **Tips de uso mobile**
  - Usar filtros primero, luego revisar cards/indicadores.
  - En historial, leer cards mobile en lugar de tabla desktop.

---

## Buenas prácticas operativas desde celular

- Mantener la caja abierta solo cuando haya operación activa.
- Cobrar pedidos desde el detalle para registrar método correctamente.
- Antes de cerrar caja, revisar diferencias y pedidos pendientes.
- Registrar gastos diariamente para estadísticas confiables.
- Confirmar datos de delivery (cliente + dirección) antes de crear pedido.

---

## Errores comunes y cómo evitarlos

- **No se puede crear pedido**
  - Verificar que la caja esté abierta.

- **No aparece dirección en delivery**
  - Seleccionar destino desde el selector de cliente/dirección o dirección manual.

- **No permite guardar gasto**
  - Debe existir al menos un ítem de gasto válido.

- **No veo cierto módulo**
  - Revisar estado de suscripción del negocio (puede limitar funciones).

---

## Criterios de calidad UX mobile

Se considera aceptable cuando:

- Acciones críticas se pueden ejecutar con una sola mano.
- No hay campos/botones inaccesibles por viewport.
- No hay cortes de contenido en diálogos largos.
- Los estados vacíos y errores guían al usuario con claridad.
- La navegación entre módulos es rápida y predecible.
