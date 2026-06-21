package com.pizzeria.backend.dto.cashshift;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record CategorySaleDto(
        @NotBlank String category,
        @NotNull @PositiveOrZero BigDecimal amount
) {}
