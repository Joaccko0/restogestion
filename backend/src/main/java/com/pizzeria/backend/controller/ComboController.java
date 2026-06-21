package com.pizzeria.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pizzeria.backend.dto.combo.ComboRequest;
import com.pizzeria.backend.dto.combo.ComboResponse;
import com.pizzeria.backend.service.ComboService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/combos")
@RequiredArgsConstructor
public class ComboController {

    private final ComboService comboService;

    @PostMapping
    public ResponseEntity<ComboResponse> create(
            @RequestParam Long businessId,
            @RequestBody @Valid ComboRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(comboService.createCombo(businessId, request));
    }

    @GetMapping
    public ResponseEntity<List<ComboResponse>> getAll(@RequestParam Long businessId) {
        return ResponseEntity.ok(comboService.getAllCombos(businessId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ComboResponse> update(
            @PathVariable Long id,
            @RequestParam Long businessId,
            @RequestBody @Valid ComboRequest request
    ) {
        return ResponseEntity.ok(comboService.updateCombo(businessId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long businessId
    ) {
        comboService.deleteCombo(businessId, id);
        return ResponseEntity.noContent().build();
    }
}