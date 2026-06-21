package com.pizzeria.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pizzeria.backend.dto.me.BusinessSummaryResponse;
import com.pizzeria.backend.dto.me.MeSessionResponse;
import com.pizzeria.backend.dto.me.UpdateBusinessSettingsRequest;
import com.pizzeria.backend.model.User;
import com.pizzeria.backend.service.MeService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final MeService meService;

    @GetMapping("/session")
    public ResponseEntity<MeSessionResponse> getSession(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(new MeSessionResponse(user.isSuperAdmin(), user.getEmail()));
    }

    /**
     * Lista los negocios a los que el usuario actual tiene acceso.
     */
    @GetMapping("/businesses")
    public ResponseEntity<List<BusinessSummaryResponse>> getMyBusinesses(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(meService.listBusinessesForUser(user));
    }

    @PatchMapping("/businesses/{businessId}/settings")
    public ResponseEntity<BusinessSummaryResponse> updateBusinessSettings(
            @AuthenticationPrincipal User user,
            @PathVariable Long businessId,
            @RequestBody @Valid UpdateBusinessSettingsRequest request
    ) {
        return ResponseEntity.ok(meService.updateBusinessSettings(user, businessId, request));
    }
}
