package com.pizzeria.backend.dto.me;

import java.time.LocalDate;

import com.pizzeria.backend.model.enums.BusinessBillingStatus;

/**
 * Negocio al que el usuario autenticado tiene acceso (vía {@link com.pizzeria.backend.model.UserBusinessRole}).
 */
public record BusinessSummaryResponse(
        Long id,
        String name,
        BusinessBillingStatus billingStatus,
        LocalDate expiresAt,
        boolean warningExpirySoon,
        long morosoGraceDaysLeft
) {}
