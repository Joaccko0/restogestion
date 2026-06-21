package com.pizzeria.backend.dto.order;

import java.math.BigDecimal;
import java.util.List;

import com.pizzeria.backend.model.enums.DeliveryMethod;
import com.pizzeria.backend.model.enums.PaymentMethod;
import com.pizzeria.backend.model.enums.PaymentStatus;

import jakarta.validation.Valid;

/**
 * DTO para actualizar detalles de pago, entrega e ítems de una orden
 * (sin afectar el orderStatus)
 */
public record UpdateOrderDetailsRequest(
    PaymentStatus paymentStatus,
    PaymentMethod paymentMethod,
    DeliveryMethod deliveryMethod,
    Long customerId,
    Long addressId,
    String manualAddress,
    BigDecimal deliveryFee,
    List<@Valid OrderItemRequest> items,
    List<@Valid OrderPaymentRequest> payments
) {}
