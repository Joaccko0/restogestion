package com.pizzeria.backend.dto.admin;

import jakarta.annotation.Nullable;

public record AdminPatchUserRequest(
        @Nullable String firstName,
        @Nullable String lastName,
        @Nullable String password
) {}
