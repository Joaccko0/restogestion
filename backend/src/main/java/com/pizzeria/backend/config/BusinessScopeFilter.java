package com.pizzeria.backend.config;

import java.io.IOException;

import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.pizzeria.backend.model.User;
import com.pizzeria.backend.service.BusinessAccessService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Exige {@code businessId} en query y que el usuario autenticado tenga rol en ese negocio (anti-IDOR).
 */
@Component
@RequiredArgsConstructor
public class BusinessScopeFilter extends OncePerRequestFilter {

    private final BusinessAccessService businessAccessService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }

        if (!path.startsWith("/api/")
                || path.startsWith("/api/auth/")
                || path.startsWith("/api/me/")
                || path.startsWith("/api/admin/")) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        Object principal = auth.getPrincipal();
        if (!(principal instanceof User user)) {
            filterChain.doFilter(request, response);
            return;
        }

        String bidParam = request.getParameter("businessId");
        if (bidParam == null || bidParam.isBlank()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Query parameter businessId is required");
            return;
        }

        long businessId;
        try {
            businessId = Long.parseLong(bidParam.trim());
        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid businessId");
            return;
        }

        if (!businessAccessService.userHasAccessToBusiness(user, businessId)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "No tienes acceso a este negocio");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
