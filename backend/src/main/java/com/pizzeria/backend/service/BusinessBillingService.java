package com.pizzeria.backend.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pizzeria.backend.model.Business;
import com.pizzeria.backend.model.enums.BusinessBillingStatus;
import com.pizzeria.backend.repository.BusinessRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BusinessBillingService {

    public static final int GRACE_DAYS_AFTER_EXPIRY = 10;

    private final BusinessRepository businessRepository;

    /**
     * Estado efectivo según fechas (sin persistir). GRATIS se respeta tal cual.
     */
    public BusinessBillingStatus effectiveBillingStatus(Business business) {
        if (business.getBillingStatus() == BusinessBillingStatus.GRATIS) {
            return BusinessBillingStatus.GRATIS;
        }
        if (business.getExpiresAt() == null) {
            return business.getBillingStatus();
        }
        LocalDate today = LocalDate.now();
        LocalDate exp = business.getExpiresAt();
        LocalDate graceEnd = exp.plusDays(GRACE_DAYS_AFTER_EXPIRY);

        if (today.isAfter(graceEnd)) {
            return BusinessBillingStatus.VENCIDO;
        }
        if (today.isAfter(exp)) {
            return BusinessBillingStatus.MOROSO;
        }
        return BusinessBillingStatus.VIGENTE;
    }

    /**
     * Persiste {@link Business#getBillingStatus()} alineado con las fechas.
     */
    @Transactional
    public void syncStatusFromDates(Business business) {
        if (business.getBillingStatus() == BusinessBillingStatus.GRATIS) {
            return;
        }
        BusinessBillingStatus next = effectiveBillingStatus(business);
        business.setBillingStatus(next);
    }

    @Transactional
    public void recalculateAllBusinesses() {
        businessRepository.findAll().forEach(b -> {
            if (b.getBillingStatus() != BusinessBillingStatus.GRATIS) {
                syncStatusFromDates(b);
                businessRepository.save(b);
            }
        });
    }

    public long daysUntilExpiry(LocalDate expiresAt) {
        if (expiresAt == null) {
            return Long.MAX_VALUE;
        }
        return ChronoUnit.DAYS.between(LocalDate.now(), expiresAt);
    }

    public boolean isWarningExpirySoon(Business b) {
        if (effectiveBillingStatus(b) != BusinessBillingStatus.VIGENTE || b.getExpiresAt() == null) {
            return false;
        }
        long d = daysUntilExpiry(b.getExpiresAt());
        return d >= 0 && d <= 5;
    }

    public long morosoGraceDaysLeft(Business b) {
        if (effectiveBillingStatus(b) != BusinessBillingStatus.MOROSO || b.getExpiresAt() == null) {
            return 0;
        }
        LocalDate graceEnd = b.getExpiresAt().plusDays(GRACE_DAYS_AFTER_EXPIRY);
        return Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), graceEnd));
    }
}
