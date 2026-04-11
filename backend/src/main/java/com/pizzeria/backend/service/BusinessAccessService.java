package com.pizzeria.backend.service;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.pizzeria.backend.model.User;

import lombok.RequiredArgsConstructor;

/**
 * Comprueba que un usuario tenga un rol en el negocio indicado (mitigación IDOR sobre {@code businessId}).
 */
@Service
@RequiredArgsConstructor
public class BusinessAccessService {

    public boolean userHasAccessToBusiness(User user, Long businessId) {
        if (user == null || businessId == null) {
            return false;
        }
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return false;
        }
        return user.getRoles().stream()
                .anyMatch(r -> businessId.equals(r.getBusinessId()));
    }

    public void assertUserHasAccessToBusiness(User user, Long businessId) {
        if (!userHasAccessToBusiness(user, businessId)) {
            throw new AccessDeniedException("No tienes acceso a este negocio");
        }
    }
}
