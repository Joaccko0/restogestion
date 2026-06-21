package com.pizzeria.backend.mapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzeria.backend.dto.cashshift.CashShiftResponse;
import com.pizzeria.backend.dto.cashshift.CategorySaleDto;
import com.pizzeria.backend.dto.cashshift.PaymentMethodSaleDto;
import com.pizzeria.backend.model.CashShift;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class CashShiftMapper {

    /** JSON corrupto por escapes erróneos (p. ej. psql/PowerShell): \\PIZZAS\\,\\quantity\\:1000 */
    private static final Pattern LEGACY_QUANTITY =
            Pattern.compile("\\\\([A-Z_]+)\\\\,\\\\quantity\\\\:(\\d+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern LEGACY_AMOUNT =
            Pattern.compile("\\\\([A-Z_]+)\\\\,\\\\amount\\\\:([\\d.]+)", Pattern.CASE_INSENSITIVE);

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
                parseCategorySales(cashShift.getManualCategorySales()),
                parsePaymentBreakdown(cashShift.getManualPaymentBreakdown())
        );
    }

    private List<PaymentMethodSaleDto> parsePaymentBreakdown(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<PaymentMethodSaleDto>>() {});
        } catch (Exception e) {
            log.warn("No se pudo parsear manual_payment_breakdown: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<CategorySaleDto> parseCategorySales(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        List<CategorySaleDto> parsed = parseCategorySalesJson(json);
        if (!parsed.isEmpty()) {
            return parsed;
        }
        parsed = parseLegacyEscapedCategorySales(json);
        if (!parsed.isEmpty()) {
            log.warn(
                    "manual_category_sales en formato legacy (JSON inválido); se recuperaron {} categorías",
                    parsed.size()
            );
        } else {
            log.warn("No se pudo parsear manual_category_sales");
        }
        return parsed;
    }

    private List<CategorySaleDto> parseCategorySalesJson(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            if (!root.isArray()) {
                return Collections.emptyList();
            }
            List<CategorySaleDto> result = new ArrayList<>();
            for (JsonNode node : root) {
                String category = textOrNull(node.get("category"));
                if (category == null || category.isBlank()) {
                    continue;
                }
                BigDecimal amount = decimalOrNull(node.get("amount"));
                Integer quantity = integerOrNull(node.get("quantity"));
                if (amount == null && quantity == null) {
                    continue;
                }
                result.add(new CategorySaleDto(category, amount, quantity));
            }
            return result;
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    /**
     * Recupera categorías de JSON inválido con escapes rotos (\\:, \\,) sin comillas.
     */
    private List<CategorySaleDto> parseLegacyEscapedCategorySales(String json) {
        if (!json.contains("\\:") && !json.contains("\\,")) {
            return Collections.emptyList();
        }
        Map<String, CategorySaleDto> byCategory = new LinkedHashMap<>();

        Matcher qtyMatcher = LEGACY_QUANTITY.matcher(json);
        while (qtyMatcher.find()) {
            String category = qtyMatcher.group(1).trim();
            int quantity = Integer.parseInt(qtyMatcher.group(2));
            mergeLegacyCategory(byCategory, category, null, quantity);
        }

        Matcher amtMatcher = LEGACY_AMOUNT.matcher(json);
        while (amtMatcher.find()) {
            String category = amtMatcher.group(1).trim();
            BigDecimal amount = new BigDecimal(amtMatcher.group(2));
            mergeLegacyCategory(byCategory, category, amount, null);
        }

        return new ArrayList<>(byCategory.values());
    }

    private static void mergeLegacyCategory(
            Map<String, CategorySaleDto> byCategory,
            String category,
            BigDecimal amount,
            Integer quantity
    ) {
        CategorySaleDto existing = byCategory.get(category);
        if (existing == null) {
            byCategory.put(category, new CategorySaleDto(category, amount, quantity));
            return;
        }
        byCategory.put(
                category,
                new CategorySaleDto(
                        category,
                        amount != null ? amount : existing.amount(),
                        quantity != null ? quantity : existing.quantity()
                )
        );
    }

    private static String textOrNull(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        return node.asText();
    }

    private static BigDecimal decimalOrNull(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.decimalValue();
        }
        String text = node.asText();
        if (text == null || text.isBlank()) {
            return null;
        }
        return new BigDecimal(text);
    }

    private static Integer integerOrNull(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.intValue();
        }
        String text = node.asText();
        if (text == null || text.isBlank()) {
            return null;
        }
        return new BigDecimal(text).intValue();
    }
}
