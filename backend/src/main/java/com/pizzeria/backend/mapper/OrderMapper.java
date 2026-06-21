package com.pizzeria.backend.mapper;

import java.math.BigDecimal;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.pizzeria.backend.dto.order.OrderResponse;
import com.pizzeria.backend.model.Order;
import com.pizzeria.backend.model.OrderItem;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "addressId", source = "address.id")
    @Mapping(target = "deliveryAddress", source = "order", qualifiedByName = "formatAddress")
    @Mapping(target = "cashShiftId", source = "cashShift.id")
    @Mapping(target = "subtotal", source = "order", qualifiedByName = "orderSubtotal")
    @Mapping(target = "deliveryFee", source = "deliveryFee")
    @Mapping(target = "payments", source = "payments")
    OrderResponse toResponse(Order order);

    OrderResponse.OrderPaymentResponse toPaymentResponse(com.pizzeria.backend.model.OrderPayment payment);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "comboId", source = "combo.id")
    @Mapping(target = "name", source = "item", qualifiedByName = "resolveName")
    @Mapping(target = "category", source = "item", qualifiedByName = "resolveCategory")
    OrderResponse.OrderItemResponse toItemResponse(OrderItem item);

    @Named("orderSubtotal")
    default BigDecimal orderSubtotal(Order order) {
        BigDecimal total = order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO;
        BigDecimal fee = order.getDeliveryFee() != null ? order.getDeliveryFee() : BigDecimal.ZERO;
        return total.subtract(fee);
    }

    @Named("formatAddress")
    default String formatAddress(Order order) {
        if (order.getManualAddress() != null && !order.getManualAddress().isBlank()) {
            return order.getManualAddress();
        }
        if (order.getAddress() != null) {
            var addr = order.getAddress();
            String base = addr.getStreet() + " " + addr.getNumber();
            if (addr.getDescription() != null && !addr.getDescription().isEmpty()) {
                base += " (" + addr.getDescription() + ")";
            }
            return base;
        }
        return null;
    }

    @Named("resolveName")
    default String resolveName(OrderItem item) {
        if (item.getProduct() != null) {
            return item.getProduct().getTitle();
        } else if (item.getCombo() != null) {
            return item.getCombo().getName();
        }
        return "Item Desconocido";
    }

    @Named("resolveCategory")
    default String resolveCategory(OrderItem item) {
        if (item.getProduct() != null && item.getProduct().getCategory() != null) {
            return item.getProduct().getCategory();
        }
        if (item.getCombo() != null) {
            return "OTROS";
        }
        return "OTROS";
    }
}
