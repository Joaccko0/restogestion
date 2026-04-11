package com.pizzeria.backend.dto.admin;

import com.pizzeria.backend.model.enums.Role;

import jakarta.validation.constraints.NotNull;

public record AdminAssignRoleRequest(
        @NotNull Long businessId,
        @NotNull Role role
) {}
