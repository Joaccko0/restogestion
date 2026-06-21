package com.pizzeria.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pizzeria.backend.dto.category.MenuCategoryRequest;
import com.pizzeria.backend.dto.category.MenuCategoryResponse;
import com.pizzeria.backend.service.MenuCategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/menu-categories")
@RequiredArgsConstructor
public class MenuCategoryController {

    private final MenuCategoryService menuCategoryService;

    @GetMapping
    public ResponseEntity<List<MenuCategoryResponse>> list(@RequestParam Long businessId) {
        return ResponseEntity.ok(menuCategoryService.listCategories(businessId));
    }

    @PostMapping
    public ResponseEntity<MenuCategoryResponse> create(
            @RequestParam Long businessId,
            @RequestBody @Valid MenuCategoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(menuCategoryService.createCategory(businessId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long businessId
    ) {
        menuCategoryService.deleteCategory(businessId, id);
        return ResponseEntity.noContent().build();
    }
}
