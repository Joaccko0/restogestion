package com.pizzeria.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzeria.backend.dto.cashshift.CategorySaleDto;
import com.pizzeria.backend.dto.cashshift.CloseCashShiftRequest;
import com.pizzeria.backend.model.CashShift;
import com.pizzeria.backend.model.CashShift.CashShiftStatus;
import com.pizzeria.backend.model.Order;
import com.pizzeria.backend.model.enums.OrderStatus;
import com.pizzeria.backend.repository.CashShiftRepository;
import com.pizzeria.backend.repository.OrderRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CashShiftService {

    private final CashShiftRepository cashShiftRepository;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public CashShift openCashShift(Long businessId, BigDecimal startAmount) {
        if (cashShiftRepository.hasCashShiftOpen(businessId)) {
            throw new IllegalStateException("Ya hay una caja abierta para este negocio. Ciérrala primero.");
        }

        CashShift cashShift = CashShift.builder()
                .businessId(businessId)
                .status(CashShiftStatus.OPEN)
                .startDate(LocalDateTime.now())
                .startAmount(startAmount)
                .build();

        return cashShiftRepository.save(cashShift);
    }

    @Transactional
    public CashShift closeCashShift(Long businessId, CloseCashShiftRequest request) {
        CashShift cashShift = cashShiftRepository.findOpenCashShift(businessId)
                .orElseThrow(() -> new EntityNotFoundException("No hay caja abierta para este negocio"));

        cashShift.setStatus(CashShiftStatus.CLOSED);
        cashShift.setEndDate(LocalDateTime.now());
        cashShift.setEndAmount(request.endAmount());

        if (request.manualTotalCollected() != null) {
            cashShift.setManualTotalCollected(request.manualTotalCollected());
        }

        if (request.categorySales() != null && !request.categorySales().isEmpty()) {
            try {
                cashShift.setManualCategorySales(objectMapper.writeValueAsString(request.categorySales()));
            } catch (Exception e) {
                throw new IllegalArgumentException("No se pudo guardar el desglose por categoría");
            }
        }

        List<Order> orders = orderRepository.findByBusinessIdAndCashShiftOrderByCreatedAtDesc(businessId, cashShift);
        orders.forEach(order -> order.setOrderStatus(OrderStatus.DELIVERED));
        orderRepository.saveAll(orders);

        return cashShiftRepository.save(cashShift);
    }

    @Transactional(readOnly = true)
    public CashShift getOpenCashShift(Long businessId) {
        return cashShiftRepository.findOpenCashShift(businessId)
                .orElseThrow(() -> new EntityNotFoundException("No hay caja abierta para este negocio"));
    }

    @Transactional(readOnly = true)
    public CashShift getCashShiftById(Long businessId, Long cashShiftId) {
        return cashShiftRepository.findByIdAndBusinessId(cashShiftId, businessId)
                .orElseThrow(() -> new EntityNotFoundException("Caja no encontrada"));
    }

    @Transactional(readOnly = true)
    public List<CashShift> getAllCashShifts(Long businessId) {
        return cashShiftRepository.findByBusinessId(businessId);
    }
}
