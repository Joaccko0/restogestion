package com.pizzeria.backend.dto.admin;

import java.time.LocalDate;

import com.pizzeria.backend.model.enums.BusinessBillingStatus;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotBlank;

public record AdminCreateBusinessRequest(
        @NotBlank String name,
        @Nullable BusinessBillingStatus billingStatus,
        @Nullable LocalDate expiresAt
) {}
