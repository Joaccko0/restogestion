package com.pizzeria.backend.dto.me;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateBusinessSettingsRequest(
        @NotNull @PositiveOrZero BigDecimal deliveryFee
) {}
