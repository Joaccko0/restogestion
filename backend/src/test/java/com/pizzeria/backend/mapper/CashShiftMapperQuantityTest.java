package com.pizzeria.backend.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzeria.backend.dto.cashshift.CashShiftResponse;
import com.pizzeria.backend.model.CashShift;
import com.pizzeria.backend.model.CashShift.CashShiftStatus;

class CashShiftMapperQuantityTest {

    private final CashShiftMapper mapper = new CashShiftMapper(new ObjectMapper());

    @Test
    void mapsManualCategoryQuantitiesFromJson() {
        CashShift shift = CashShift.builder()
                .id(1L)
                .businessId(1L)
                .status(CashShiftStatus.CLOSED)
                .startDate(java.time.LocalDateTime.now())
                .startAmount(java.math.BigDecimal.ZERO)
                .manualCategorySales(
                        "[{\"category\":\"PIZZAS\",\"quantity\":1000},{\"category\":\"EMPANADAS\",\"quantity\":500}]"
                )
                .build();

        CashShiftResponse response = mapper.toResponse(shift);

        assertEquals(2, response.categorySales().size());
        assertEquals(1000, response.categorySales().get(0).quantity());
        assertEquals(500, response.categorySales().get(1).quantity());
    }

    @Test
    void mapsManualCategoryQuantitiesFromLegacyCorruptJson() {
        String corrupt =
                "[{\" category\\:\\PIZZAS\\,\\quantity\\:1000},{\\category\\:\\EMPANADAS\\,\\quantity\\:500}]";
        CashShift shift = CashShift.builder()
                .id(2L)
                .businessId(1L)
                .status(CashShiftStatus.CLOSED)
                .startDate(java.time.LocalDateTime.now())
                .startAmount(java.math.BigDecimal.ZERO)
                .manualCategorySales(corrupt)
                .build();

        CashShiftResponse response = mapper.toResponse(shift);

        assertEquals(2, response.categorySales().size());
        assertEquals(1000, response.categorySales().stream()
                .filter((cs) -> "PIZZAS".equals(cs.category()))
                .findFirst()
                .orElseThrow()
                .quantity());
        assertEquals(500, response.categorySales().stream()
                .filter((cs) -> "EMPANADAS".equals(cs.category()))
                .findFirst()
                .orElseThrow()
                .quantity());
    }
}
