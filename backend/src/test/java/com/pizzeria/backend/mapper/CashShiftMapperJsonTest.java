package com.pizzeria.backend.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzeria.backend.dto.cashshift.CategorySaleDto;

class CashShiftMapperJsonTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void deserializesCategorySalesWithQuantityOnly() throws Exception {
        String json = "[{\"category\":\"PIZZAS\",\"quantity\":1000}]";
        List<CategorySaleDto> list = objectMapper.readValue(json, new TypeReference<>() {});
        assertEquals(1, list.size());
        assertEquals("PIZZAS", list.get(0).category());
        assertEquals(1000, list.get(0).quantity());
    }

    @Test
    void roundTripCategorySalesWithQuantityOnly() throws Exception {
        List<CategorySaleDto> original = List.of(new CategorySaleDto("PIZZAS", null, 1000));
        String json = objectMapper.writeValueAsString(original);
        List<CategorySaleDto> parsed = objectMapper.readValue(json, new TypeReference<>() {});
        assertEquals(1000, parsed.get(0).quantity());
        assertNotNull(json);
    }
}
