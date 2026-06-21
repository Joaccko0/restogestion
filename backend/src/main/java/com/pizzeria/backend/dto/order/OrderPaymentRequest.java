package com.pizzeria.backend.dto.order;

import java.math.BigDecimal;

import com.pizzeria.backend.model.enums.PaymentMethod;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record OrderPaymentRequest(
        @NotNull PaymentMethod paymentMethod,
        @NotNull @Positive BigDecimal amount
) {}
