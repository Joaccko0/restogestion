package com.pizzeria.backend.dto.me;

public record MeSessionResponse(
        boolean superAdmin,
        String email
) {}
