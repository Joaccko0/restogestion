package com.pizzeria.backend.dto.admin;

import java.time.LocalDate;

import com.pizzeria.backend.model.enums.BusinessBillingStatus;

public record AdminBusinessResponse(
        Long id,
        String name,
        BusinessBillingStatus billingStatus,
        LocalDate expiresAt
) {}
