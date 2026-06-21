package com.pizzeria.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pizzeria.backend.dto.cashshift.CashShiftRequest;
import com.pizzeria.backend.dto.cashshift.CashShiftResponse;
import com.pizzeria.backend.dto.cashshift.CloseCashShiftRequest;
import com.pizzeria.backend.mapper.CashShiftMapper;
import com.pizzeria.backend.model.CashShift;
import com.pizzeria.backend.service.CashShiftService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller para gestión de cajas (CashShift)
 */
@RestController
@RequestMapping("/api/cash-shifts")
@RequiredArgsConstructor
public class CashShiftController {

    private final CashShiftService cashShiftService;
    private final CashShiftMapper cashShiftMapper;

    /**
     * Abre una nueva caja para un negocio
     * 
     * POST /api/cash-shifts?businessId=1
     * {
     *   "startAmount": 1000.00
     * }
     */
    @PostMapping
    public ResponseEntity<CashShiftResponse> openCashShift(
            @RequestParam Long businessId,
            @RequestBody @Valid CashShiftRequest request
    ) {
        CashShift cashShift = cashShiftService.openCashShift(businessId, request.startAmount());
        return ResponseEntity.status(HttpStatus.CREATED).body(cashShiftMapper.toResponse(cashShift));
    }

    /**
     * Cierra la caja abierta de un negocio
     * 
     * PUT /api/cash-shifts/close?businessId=1
     * {
     *   "startAmount": 1500.00
     * }
     */
    @PutMapping("/close")
    public ResponseEntity<CashShiftResponse> closeCashShift(
            @RequestParam Long businessId,
            @RequestBody @Valid CloseCashShiftRequest request
    ) {
        CashShift cashShift = cashShiftService.closeCashShift(businessId, request);
        return ResponseEntity.ok(cashShiftMapper.toResponse(cashShift));
    }

    /**
     * Obtiene la caja abierta actual
     * 
     * GET /api/cash-shifts/open?businessId=1
     */
    @GetMapping("/open")
    public ResponseEntity<?> getOpenCashShift(
            @RequestParam Long businessId
    ) {
        try {
            CashShift cashShift = cashShiftService.getOpenCashShift(businessId);
            return ResponseEntity.ok(cashShiftMapper.toResponse(cashShift));
        } catch (jakarta.persistence.EntityNotFoundException ex) {
            // No hay caja abierta
            return ResponseEntity.noContent().build();
        }
    }

    /**
     * Obtiene una caja específica por ID
     * 
     * GET /api/cash-shifts/{id}?businessId=1
     */
    @GetMapping("/{id}")
    public ResponseEntity<CashShiftResponse> getCashShiftById(
            @PathVariable Long id,
            @RequestParam Long businessId
    ) {
        CashShift cashShift = cashShiftService.getCashShiftById(businessId, id);
        return ResponseEntity.ok(cashShiftMapper.toResponse(cashShift));
    }

    /**
     * Lista todas las cajas de un negocio
     * 
     * GET /api/cash-shifts?businessId=1
     */
    @GetMapping
    public ResponseEntity<List<CashShiftResponse>> getAllCashShifts(
            @RequestParam Long businessId
    ) {
        List<CashShift> cashShifts = cashShiftService.getAllCashShifts(businessId);
        List<CashShiftResponse> responses = cashShifts.stream()
                .map(cashShiftMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }
}
