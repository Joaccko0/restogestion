package com.pizzeria.backend.dto.cashshift;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * DTO para cerrar una CashShift (cerrar caja)
 */
public record CloseCashShiftRequest(
    @NotNull(message = "El monto final es requerido")
    @PositiveOrZero(message = "El monto final debe ser mayor o igual a 0")
    BigDecimal endAmount,

    /** Total recaudado del turno (opcional, para estadísticas manuales). */
    @PositiveOrZero(message = "El total recaudado debe ser mayor o igual a 0")
    BigDecimal manualTotalCollected,

    /** Ventas por categoría (opcional). */
    @Valid
    List<CategorySaleDto> categorySales
) {}
