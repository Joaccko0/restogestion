package com.pizzeria.backend.dto.admin;

import java.time.LocalDate;

import com.pizzeria.backend.model.enums.BusinessBillingStatus;

import jakarta.annotation.Nullable;

public record AdminPatchBusinessRequest(
        @Nullable String name,
        @Nullable BusinessBillingStatus billingStatus,
        @Nullable LocalDate expiresAt
) {}
