package com.pizzeria.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pizzeria.backend.dto.admin.AdminAssignRoleRequest;
import com.pizzeria.backend.dto.admin.AdminCreateUserRequest;
import com.pizzeria.backend.dto.admin.AdminPatchUserRequest;
import com.pizzeria.backend.dto.admin.AdminUserResponse;
import com.pizzeria.backend.service.AdminUserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<List<AdminUserResponse>> list() {
        return ResponseEntity.ok(adminUserService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getById(id));
    }

    @PostMapping
    public ResponseEntity<AdminUserResponse> create(@RequestBody @Valid AdminCreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUserService.createTenant(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AdminUserResponse> patch(
            @PathVariable Long id,
            @RequestBody @Valid AdminPatchUserRequest request
    ) {
        return ResponseEntity.ok(adminUserService.patchUser(id, request));
    }

    @PostMapping("/{id}/roles")
    public ResponseEntity<AdminUserResponse> assignRole(
            @PathVariable Long id,
            @RequestBody @Valid AdminAssignRoleRequest request
    ) {
        return ResponseEntity.ok(adminUserService.assignRole(id, request));
    }

    @DeleteMapping("/{id}/roles")
    public ResponseEntity<AdminUserResponse> removeRole(
            @PathVariable Long id,
            @RequestParam Long businessId
    ) {
        return ResponseEntity.ok(adminUserService.removeRole(id, businessId));
    }
}
