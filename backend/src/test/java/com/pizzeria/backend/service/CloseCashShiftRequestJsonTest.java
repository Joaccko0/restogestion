package com.pizzeria.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzeria.backend.dto.cashshift.CategorySaleDto;
import com.pizzeria.backend.dto.cashshift.CloseCashShiftRequest;

class CloseCashShiftRequestJsonTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void deserializesCategorySalesWithQuantityOnly() throws Exception {
        String json = """
                {
                  "endAmount": 1000,
                  "manualTotalCollected": 5000,
                  "categorySales": [
                    {"category": "PIZZAS", "quantity": 1000},
                    {"category": "EMPANADAS", "quantity": 1000}
                  ]
                }
                """;

        CloseCashShiftRequest request = objectMapper.readValue(json, CloseCashShiftRequest.class);

        assertEquals(new BigDecimal("1000"), request.endAmount());
        assertEquals(2, request.categorySales().size());
        assertEquals(1000, request.categorySales().get(0).quantity());
        assertEquals(null, request.categorySales().get(0).amount());

        String stored = objectMapper.writeValueAsString(request.categorySales());
        assertTrue(stored.contains("\"quantity\":1000"));
    }

    @Test
    void roundTripQuantityOnlyCategorySales() throws Exception {
        List<CategorySaleDto> original = List.of(
                new CategorySaleDto("PIZZAS", null, 1000),
                new CategorySaleDto("EMPANADAS", null, 500)
        );
        String json = objectMapper.writeValueAsString(original);
        List<CategorySaleDto> parsed = objectMapper.readValue(
                json,
                objectMapper.getTypeFactory().constructCollectionType(List.class, CategorySaleDto.class)
        );
        assertEquals(1000, parsed.get(0).quantity());
        assertEquals(500, parsed.get(1).quantity());
    }
}
