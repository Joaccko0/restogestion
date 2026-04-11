package com.pizzeria.backend.dto.admin;

import java.util.List;

import com.pizzeria.backend.model.enums.Role;

public record AdminUserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        boolean superAdmin,
        List<AdminUserBusinessRoleResponse> businessRoles
) {
    public record AdminUserBusinessRoleResponse(Long linkId, Long businessId, String businessName, Role role) {}
}
