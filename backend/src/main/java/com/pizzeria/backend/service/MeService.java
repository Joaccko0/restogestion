package com.pizzeria.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pizzeria.backend.dto.me.BusinessSummaryResponse;
import com.pizzeria.backend.model.Business;
import com.pizzeria.backend.model.User;
import com.pizzeria.backend.model.UserBusinessRole;
import com.pizzeria.backend.repository.BusinessRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MeService {

    private final BusinessRepository businessRepository;
    private final BusinessBillingService businessBillingService;

    @Transactional(readOnly = true)
    public List<BusinessSummaryResponse> listBusinessesForUser(User user) {
        if (user == null || user.getRoles() == null || user.getRoles().isEmpty()) {
            return List.of();
        }
        List<BusinessSummaryResponse> out = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        for (UserBusinessRole link : user.getRoles()) {
            Long bid = link.getBusinessId();
            if (bid == null || !seen.add(bid)) {
                continue;
            }
            businessRepository.findById(bid).ifPresent(b -> out.add(toResponse(b)));
        }
        out.sort(Comparator.comparing(BusinessSummaryResponse::id));
        return List.copyOf(out);
    }

    private BusinessSummaryResponse toResponse(Business b) {
        var effective = businessBillingService.effectiveBillingStatus(b);
        boolean warn = businessBillingService.isWarningExpirySoon(b);
        long morosoLeft = businessBillingService.morosoGraceDaysLeft(b);
        return new BusinessSummaryResponse(
                b.getId(),
                b.getName(),
                effective,
                b.getExpiresAt(),
                warn,
                morosoLeft
        );
    }
}
