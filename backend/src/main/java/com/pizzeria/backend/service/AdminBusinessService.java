package com.pizzeria.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pizzeria.backend.dto.admin.AdminBusinessResponse;
import com.pizzeria.backend.dto.admin.AdminCreateBusinessRequest;
import com.pizzeria.backend.dto.admin.AdminPatchBusinessRequest;
import com.pizzeria.backend.model.Business;
import com.pizzeria.backend.model.enums.BusinessBillingStatus;
import com.pizzeria.backend.repository.BusinessRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminBusinessService {

    private final BusinessRepository businessRepository;
    private final BusinessBillingService businessBillingService;

    @Transactional(readOnly = true)
    public List<AdminBusinessResponse> listAll() {
        return businessRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AdminBusinessResponse getById(Long id) {
        return businessRepository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Negocio no encontrado"));
    }

    @Transactional
    public AdminBusinessResponse create(AdminCreateBusinessRequest req) {
        BusinessBillingStatus status = req.billingStatus() != null ? req.billingStatus() : BusinessBillingStatus.GRATIS;
        Business business = new Business();
        business.setName(req.name().trim());
        applyBillingFields(business, status, req.expiresAt());
        return toResponse(businessRepository.save(business));
    }

    @Transactional
    public AdminBusinessResponse patch(Long id, AdminPatchBusinessRequest req) {
        Business business = businessRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Negocio no encontrado"));
        if (req.name() != null && !req.name().isBlank()) {
            business.setName(req.name().trim());
        }
        if (req.billingStatus() != null || req.expiresAt() != null) {
            BusinessBillingStatus status = req.billingStatus() != null ? req.billingStatus() : business.getBillingStatus();
            var exp = req.expiresAt() != null ? req.expiresAt() : business.getExpiresAt();
            applyBillingFields(business, status, exp);
        }
        businessBillingService.syncStatusFromDates(business);
        return toResponse(businessRepository.save(business));
    }

    private void applyBillingFields(Business business, BusinessBillingStatus status, java.time.LocalDate expiresAt) {
        if (status == BusinessBillingStatus.GRATIS) {
            business.setBillingStatus(BusinessBillingStatus.GRATIS);
            business.setExpiresAt(null);
            return;
        }
        if (expiresAt == null) {
            throw new IllegalArgumentException("Si el plan no es GRATIS, debe indicarse expiresAt");
        }
        business.setExpiresAt(expiresAt);
        business.setBillingStatus(status);
        businessBillingService.syncStatusFromDates(business);
    }

    private AdminBusinessResponse toResponse(Business b) {
        return new AdminBusinessResponse(b.getId(), b.getName(), b.getBillingStatus(), b.getExpiresAt());
    }
}
