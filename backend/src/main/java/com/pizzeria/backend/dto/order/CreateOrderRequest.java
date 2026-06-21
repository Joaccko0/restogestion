package com.pizzeria.backend.dto.order;

import java.util.List;

import com.pizzeria.backend.model.enums.DeliveryMethod;
import com.pizzeria.backend.model.enums.PaymentMethod;
import com.pizzeria.backend.model.enums.PaymentStatus;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CreateOrderRequest(
    Long customerId, // Nullable (Cliente anónimo)
    Long addressId, // Nullable (solo para DELIVERY con cliente)
    String manualAddress, // Nullable (para DELIVERY sin cliente)
    @NotNull DeliveryMethod deliveryMethod,
    @NotNull PaymentMethod paymentMethod,
    PaymentStatus paymentStatus,
    @NotNull @Valid List<OrderItemRequest> items,
    String note, // Nota opcional ("Sin aceitunas")
    java.math.BigDecimal deliveryFee // Opcional: override del costo de envío
) {}