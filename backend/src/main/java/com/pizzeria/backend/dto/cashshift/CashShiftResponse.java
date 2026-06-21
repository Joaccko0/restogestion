package com.pizzeria.backend.dto.cashshift;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de respuesta para CashShift
 */
public record CashShiftResponse(
    Long id,
    String status,
    LocalDateTime startDate,
    LocalDateTime endDate,
    BigDecimal startAmount,
    BigDecimal endAmount,
    BigDecimal manualTotalCollected,
    List<CategorySaleDto> categorySales
) {}
