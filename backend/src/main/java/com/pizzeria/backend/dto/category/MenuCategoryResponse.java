package com.pizzeria.backend.dto.category;

public record MenuCategoryResponse(
        Long id,
        String name,
        String code,
        boolean systemDefault
) {}
