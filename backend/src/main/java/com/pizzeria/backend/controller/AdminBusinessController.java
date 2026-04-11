package com.pizzeria.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pizzeria.backend.dto.admin.AdminBusinessResponse;
import com.pizzeria.backend.dto.admin.AdminCreateBusinessRequest;
import com.pizzeria.backend.dto.admin.AdminPatchBusinessRequest;
import com.pizzeria.backend.service.AdminBusinessService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/businesses")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminBusinessController {

    private final AdminBusinessService adminBusinessService;

    @GetMapping
    public ResponseEntity<List<AdminBusinessResponse>> list() {
        return ResponseEntity.ok(adminBusinessService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminBusinessResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(adminBusinessService.getById(id));
    }

    @PostMapping
    public ResponseEntity<AdminBusinessResponse> create(@RequestBody @Valid AdminCreateBusinessRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminBusinessService.create(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AdminBusinessResponse> patch(
            @PathVariable Long id,
            @RequestBody @Valid AdminPatchBusinessRequest request
    ) {
        return ResponseEntity.ok(adminBusinessService.patch(id, request));
    }
}
