package com.pizzeria.backend.dto.cashshift;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record PaymentMethodSaleDto(
        @NotBlank String method,
        @NotNull @PositiveOrZero BigDecimal amount
) {}
