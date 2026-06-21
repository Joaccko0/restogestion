package com.pizzeria.backend.dto.cashshift;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * DTO para crear una CashShift (abrir caja)
 */
public record CashShiftRequest(
    @NotNull(message = "El monto inicial es requerido")
    @PositiveOrZero(message = "El monto inicial debe ser mayor o igual a 0")
    BigDecimal startAmount
) {}
