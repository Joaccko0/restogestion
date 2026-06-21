package com.pizzeria.backend.mapper;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzeria.backend.dto.cashshift.CashShiftResponse;
import com.pizzeria.backend.dto.cashshift.CategorySaleDto;
import com.pizzeria.backend.model.CashShift;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CashShiftMapper {

    private final ObjectMapper objectMapper;

    public CashShiftResponse toResponse(CashShift cashShift) {
        return new CashShiftResponse(
                cashShift.getId(),
                cashShift.getStatus().name(),
                cashShift.getStartDate(),
                cashShift.getEndDate(),
                cashShift.getStartAmount(),
                cashShift.getEndAmount(),
                cashShift.getManualTotalCollected(),
                parseCategorySales(cashShift.getManualCategorySales())
        );
    }

    private List<CategorySaleDto> parseCategorySales(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<CategorySaleDto>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
