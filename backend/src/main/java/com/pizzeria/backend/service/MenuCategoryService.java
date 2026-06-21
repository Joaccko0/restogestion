package com.pizzeria.backend.service;

import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pizzeria.backend.dto.category.MenuCategoryRequest;
import com.pizzeria.backend.dto.category.MenuCategoryResponse;
import com.pizzeria.backend.model.MenuCategory;
import com.pizzeria.backend.repository.MenuCategoryRepository;
import com.pizzeria.backend.repository.ProductRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MenuCategoryService {

    private static final List<String[]> DEFAULTS = List.of(
            new String[] { "PIZZAS", "Pizzas" },
            new String[] { "EMPANADAS", "Empanadas" },
            new String[] { "BEBIDAS", "Bebidas" },
            new String[] { "OTROS", "Otros" }
    );

    /** Orden de visualización de las categorías predeterminadas. */
    private static final List<String> DEFAULT_ORDER = List.of(
            "PIZZAS", "EMPANADAS", "BEBIDAS", "OTROS"
    );

    private final MenuCategoryRepository menuCategoryRepository;
    private final ProductRepository productRepository;

    @Transactional
    public List<MenuCategoryResponse> listCategories(Long businessId) {
        ensureDefaults(businessId);
        return menuCategoryRepository.findByBusinessIdOrderByNameAsc(businessId).stream()
                .sorted(categoryDisplayOrder())
                .map(this::toResponse)
                .toList();
    }

    private static Comparator<MenuCategory> categoryDisplayOrder() {
        return Comparator
                .comparingInt((MenuCategory c) -> {
                    int idx = DEFAULT_ORDER.indexOf(c.getCode());
                    return idx >= 0 ? idx : DEFAULT_ORDER.size();
                })
                .thenComparing(MenuCategory::getName, String.CASE_INSENSITIVE_ORDER);
    }

    @Transactional
    public MenuCategoryResponse createCategory(Long businessId, MenuCategoryRequest request) {
        ensureDefaults(businessId);
        String name = request.name().trim();
        if (name.isEmpty()) {
            throw new IllegalArgumentException("El nombre de la categoría es obligatorio");
        }

        String baseCode = toCode(name);
        String code = baseCode;
        int suffix = 1;
        while (menuCategoryRepository.existsByBusinessIdAndCode(businessId, code)) {
            code = baseCode + "_" + suffix++;
        }

        MenuCategory category = MenuCategory.builder()
                .businessId(businessId)
                .name(name)
                .code(code)
                .systemDefault(false)
                .build();

        return toResponse(menuCategoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long businessId, Long categoryId) {
        MenuCategory category = menuCategoryRepository.findByIdAndBusinessId(categoryId, businessId)
                .orElseThrow(() -> new EntityNotFoundException("Categoría no encontrada"));

        if (category.isSystemDefault()) {
            throw new IllegalStateException("No se pueden eliminar las categorías predeterminadas");
        }

        long productsUsing = productRepository.countByBusinessIdAndCategory(businessId, category.getCode());
        if (productsUsing > 0) {
            throw new IllegalStateException(
                    "Hay productos usando esta categoría. Reasignálos antes de eliminar.");
        }

        menuCategoryRepository.delete(category);
    }

    @Transactional
    public void ensureDefaults(Long businessId) {
        for (String[] def : DEFAULTS) {
            if (menuCategoryRepository.existsByBusinessIdAndCode(businessId, def[0])) {
                continue;
            }
            menuCategoryRepository.save(MenuCategory.builder()
                    .businessId(businessId)
                    .code(def[0])
                    .name(def[1])
                    .systemDefault(true)
                    .build());
        }
    }

    public String resolveLabel(Long businessId, String code) {
        if (code == null || code.isBlank()) {
            return "Otros";
        }
        return menuCategoryRepository.findByBusinessIdAndCode(businessId, code)
                .map(MenuCategory::getName)
                .orElse(code);
    }

    private MenuCategoryResponse toResponse(MenuCategory category) {
        return new MenuCategoryResponse(
                category.getId(),
                category.getName(),
                category.getCode(),
                category.isSystemDefault()
        );
    }

    static String toCode(String name) {
        String normalized = Normalizer.normalize(name.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String code = normalized.toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_|_$", "");
        if (code.isEmpty()) {
            code = "CATEGORIA";
        }
        return code.length() > 50 ? code.substring(0, 50) : code;
    }
}
