package com.pizzeria.backend.config;

import java.io.IOException;

import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.pizzeria.backend.model.Business;
import com.pizzeria.backend.model.User;
import com.pizzeria.backend.model.enums.BusinessBillingStatus;
import com.pizzeria.backend.repository.BusinessRepository;
import com.pizzeria.backend.service.BusinessBillingService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Si el negocio está {@link BusinessBillingStatus#VENCIDO}, solo permite lecturas de estadísticas
 * (órdenes históricas, gastos, listados de cajas) y bloquea el resto.
 */
@Component
@RequiredArgsConstructor
public class SubscriptionAccessFilter extends OncePerRequestFilter {

    private final BusinessRepository businessRepository;
    private final BusinessBillingService businessBillingService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String path = stripContextPath(request);

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

        if (user.isSuperAdmin()) {
            filterChain.doFilter(request, response);
            return;
        }

        String bidParam = request.getParameter("businessId");
        if (bidParam == null || bidParam.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        long businessId;
        try {
            businessId = Long.parseLong(bidParam.trim());
        } catch (NumberFormatException e) {
            filterChain.doFilter(request, response);
            return;
        }

        Business business = businessRepository.findById(businessId).orElse(null);
        if (business == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (businessBillingService.effectiveBillingStatus(business) != BusinessBillingStatus.VENCIDO) {
            filterChain.doFilter(request, response);
            return;
        }

        if (isAllowedReadOnlyForVencido(request, path)) {
            filterChain.doFilter(request, response);
            return;
        }

        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Suscripción vencida: solo se permite consultar estadísticas");
    }

    private static String stripContextPath(HttpServletRequest request) {
        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }
        return path;
    }

    /**
     * GET de datos necesarios para la página de estadísticas (y subrutas de lectura asociadas).
     */
    private static boolean isAllowedReadOnlyForVencido(HttpServletRequest request, String path) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        if (path.startsWith("/api/orders/historic")) {
            return true;
        }
        if (path.startsWith("/api/expenses")) {
            return true;
        }
        if (path.startsWith("/api/cash-shifts/open")) {
            return false;
        }
        if (path.startsWith("/api/cash-shifts")) {
            return true;
        }
        return false;
    }
}
