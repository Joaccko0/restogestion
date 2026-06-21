package com.pizzeria.backend.dto.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.pizzeria.backend.model.enums.DeliveryMethod;
import com.pizzeria.backend.model.enums.OrderStatus;
import com.pizzeria.backend.model.enums.PaymentMethod;
import com.pizzeria.backend.model.enums.PaymentStatus;

public record OrderResponse(
    Long id,
    Long customerId,
    String customerName,
    Long addressId,
    String deliveryAddress,
    Long cashShiftId,
    OrderStatus orderStatus,
    PaymentStatus paymentStatus,
    PaymentMethod paymentMethod,
    DeliveryMethod deliveryMethod,
    BigDecimal subtotal,
    BigDecimal deliveryFee,
    BigDecimal total,
    LocalDateTime createdAt,
    List<OrderItemResponse> items,
    List<OrderPaymentResponse> payments
) {
    public record OrderItemResponse(
        Long productId,
        Long comboId,
        String name,
        String category,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
    ) {}

    public record OrderPaymentResponse(
        PaymentMethod paymentMethod,
        BigDecimal amount
    ) {}
}
