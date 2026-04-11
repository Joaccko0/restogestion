package com.pizzeria.backend.config;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.pizzeria.backend.service.BusinessBillingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class BillingStatusScheduler {

    private final BusinessBillingService businessBillingService;

    /** Recalcula estados de facturación una vez al día (hora servidor). */
    @Scheduled(cron = "${app.billing.recalculate-cron:0 0 3 * * *}")
    public void recalculateDaily() {
        log.debug("Recalculando estados de facturación (cron)");
        businessBillingService.recalculateAllBusinesses();
    }
}
