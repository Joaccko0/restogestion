package com.pizzeria.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pizzeria.backend.dto.order.CreateOrderRequest;
import com.pizzeria.backend.dto.order.OrderItemRequest;
import com.pizzeria.backend.dto.order.OrderPaymentRequest;
import com.pizzeria.backend.dto.order.OrderResponse;
import com.pizzeria.backend.dto.order.UpdateOrderStatusRequest;
import com.pizzeria.backend.mapper.OrderMapper;
import com.pizzeria.backend.model.Address;
import com.pizzeria.backend.model.Business;
import com.pizzeria.backend.model.Combo;
import com.pizzeria.backend.model.Customer;
import com.pizzeria.backend.model.Order;
import com.pizzeria.backend.model.OrderItem;
import com.pizzeria.backend.model.OrderPayment;
import com.pizzeria.backend.model.Product;
import com.pizzeria.backend.model.enums.PaymentMethod;
import com.pizzeria.backend.model.enums.DeliveryMethod;
import com.pizzeria.backend.model.enums.OrderStatus;
import com.pizzeria.backend.model.enums.PaymentStatus;
import com.pizzeria.backend.repository.AddressRepository;
import com.pizzeria.backend.repository.BusinessRepository;
import com.pizzeria.backend.repository.CashShiftRepository;
import com.pizzeria.backend.repository.ComboRepository;
import com.pizzeria.backend.repository.CustomerRepository;
import com.pizzeria.backend.repository.OrderRepository;
import com.pizzeria.backend.repository.ProductRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ComboRepository comboRepository;
    private final CustomerRepository customerRepository;
    private final AddressRepository addressRepository;
    private final CashShiftService cashShiftService;
    private final CashShiftRepository cashShiftRepository;
    private final BusinessRepository businessRepository;
    private final OrderMapper orderMapper;

    @Transactional
    public OrderResponse createOrder(Long businessId, CreateOrderRequest request) {

        // Si no mandan estado, asumimos PENDING
        PaymentStatus statusPago = (request.paymentStatus() != null) 
                                   ? request.paymentStatus() 
                                   : PaymentStatus.PENDING;
        
        // 0. VALIDAR QUE HAYA CAJA ABIERTA (CRITICO)
        var cashShift = cashShiftService.getOpenCashShift(businessId);
        
        // 1. Inicializar Pedido
        Order order = Order.builder()
                .businessId(businessId)
                .cashShift(cashShift)
                .orderStatus(OrderStatus.PENDING)
                .paymentStatus(statusPago)
                .paymentMethod(request.paymentMethod())
                .deliveryMethod(request.deliveryMethod())
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .payments(new ArrayList<>())
                .build();

        // 2. Asignar Cliente (Si existe)
        if (request.customerId() != null) {
            Customer customer = customerRepository.findByIdAndBusinessId(request.customerId(), businessId)
                    .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado"));
            order.setCustomer(customer);
        }

        // 2b. Asignar Dirección (Solo si es DELIVERY)
        if (request.deliveryMethod() == DeliveryMethod.DELIVERY) {
            if (request.addressId() != null) {
                // Dirección de cliente existente
                Address address = addressRepository.findByIdAndCustomer_BusinessId(request.addressId(), businessId)
                        .orElseThrow(() -> new EntityNotFoundException("Dirección no encontrada"));
                
                // Verificar que la dirección pertenezca al cliente del pedido (si hay cliente)
                if (request.customerId() != null && !address.getCustomer().getId().equals(request.customerId())) {
                    throw new IllegalArgumentException("La dirección no pertenece al cliente seleccionado");
                }
                
                order.setAddress(address);
            } else if (request.manualAddress() != null && !request.manualAddress().isBlank()) {
                // Dirección manual (sin cliente asociado)
                order.setManualAddress(request.manualAddress());
            } else {
                throw new IllegalArgumentException("Para DELIVERY se requiere addressId o manualAddress");
            }
        }

        // 3. Procesar Items
        applyItems(order, request.items(), businessId);

        // 4. Costo de delivery y total
        applyDeliveryFeeAndTotal(order, businessId, request.deliveryMethod(), request.deliveryFee());
        Order savedOrder = orderRepository.save(order);

        return orderMapper.toResponse(savedOrder);
    }

    private void applyItems(Order order, List<OrderItemRequest> itemRequests, Long businessId) {
        if (itemRequests == null || itemRequests.isEmpty()) {
            throw new IllegalArgumentException("El pedido debe tener al menos un ítem");
        }

        for (var itemReq : itemRequests) {
            if (!itemReq.isValid()) {
                throw new IllegalArgumentException(
                        "Cada ítem debe ser un Producto O un Combo (no ambos, no ninguno)");
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setQuantity(itemReq.quantity());

            BigDecimal currentPrice;

            if (itemReq.productId() != null) {
                Product p = productRepository.findByIdAndBusinessId(itemReq.productId(), businessId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Producto ID " + itemReq.productId() + " no encontrado"));
                item.setProduct(p);
                currentPrice = p.getPrice();
            } else {
                Combo c = comboRepository.findByIdAndBusinessId(itemReq.comboId(), businessId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Combo ID " + itemReq.comboId() + " no encontrado"));
                item.setCombo(c);
                currentPrice = c.getPrice();
            }

            item.setUnitPrice(currentPrice);
            item.setSubtotal(currentPrice.multiply(BigDecimal.valueOf(itemReq.quantity())));
            order.getItems().add(item);
        }
    }

    private void applyDeliveryFeeAndTotal(
            Order order,
            Long businessId,
            DeliveryMethod deliveryMethod,
            BigDecimal deliveryFeeOverride
    ) {
        BigDecimal itemsTotal = order.getItems().stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal deliveryFee = BigDecimal.ZERO;
        if (deliveryMethod == DeliveryMethod.DELIVERY) {
            if (deliveryFeeOverride != null) {
                deliveryFee = deliveryFeeOverride.max(BigDecimal.ZERO);
            } else if (order.getDeliveryFee() != null) {
                deliveryFee = order.getDeliveryFee();
            } else {
                Business business = businessRepository.findById(businessId)
                        .orElseThrow(() -> new EntityNotFoundException("Negocio no encontrado"));
                deliveryFee = business.getDeliveryFee() != null ? business.getDeliveryFee() : BigDecimal.ZERO;
            }
        }

        order.setDeliveryFee(deliveryFee);
        order.setTotal(itemsTotal.add(deliveryFee));
    }

    private void recalculateOrderTotal(Order order, Long businessId, BigDecimal deliveryFeeOverride) {
        applyDeliveryFeeAndTotal(order, businessId, order.getDeliveryMethod(), deliveryFeeOverride);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(Long businessId) {
        // Obtener la caja abierta sin lanzar excepciones dentro de la transacción
        var cashShift = cashShiftRepository.findOpenCashShift(businessId);
        
        if (cashShift.isPresent()) {
            // Si hay caja abierta, retornar los pedidos de esa caja
            return orderRepository.findByBusinessIdAndCashShiftOrderByCreatedAtDesc(businessId, cashShift.get()).stream()
                    .map(orderMapper::toResponse)
                    .toList();
        } else {
            // Si no hay caja abierta, retornar lista vacía
            return java.util.Collections.emptyList();
        }
    }

    /**
     * Obtiene todos los pedidos de un negocio (sin filtro de caja)
     * Útil para reportes históricos
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrdersHistoric(Long businessId) {
        return orderRepository.findByBusinessIdOrderByCreatedAtDesc(businessId).stream()
                .map(orderMapper::toResponse)
                .toList();
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long businessId, Long orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findByIdAndBusinessId(orderId, businessId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Pedido no encontrado"));
        
        order.setOrderStatus(request.orderStatus());
        // Si vienen cambios en paymentStatus, aplicarlos también
        if (request.paymentStatus() != null) {
            order.setPaymentStatus(request.paymentStatus());
        }

        orderRepository.save(order);

        return orderMapper.toResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderDetails(Long businessId, Long orderId,
            com.pizzeria.backend.dto.order.UpdateOrderDetailsRequest request) {
        Order order = orderRepository.findByIdAndBusinessId(orderId, businessId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Pedido no encontrado"));

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("No se puede editar un pedido cancelado");
        }

        if (request.items() != null) {
            if (order.getOrderStatus() == OrderStatus.DELIVERED) {
                throw new IllegalStateException(
                        "No se pueden modificar los ítems de un pedido entregado");
            }
            if (order.getItems() == null) {
                order.setItems(new ArrayList<>());
            } else {
                order.getItems().clear();
            }
            applyItems(order, request.items(), businessId);
            resetPaymentIfNeeded(order);
        }

        if (request.paymentStatus() != null) {
            order.setPaymentStatus(request.paymentStatus());
        }
        if (request.paymentMethod() != null) {
            order.setPaymentMethod(request.paymentMethod());
        }
        if (request.deliveryMethod() != null) {
            order.setDeliveryMethod(request.deliveryMethod());
            if (request.deliveryMethod() != DeliveryMethod.DELIVERY) {
                order.setAddress(null);
                order.setManualAddress(null);
            }
        }

        if (request.customerId() != null) {
            Customer customer = customerRepository.findByIdAndBusinessId(request.customerId(), businessId)
                    .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado"));
            order.setCustomer(customer);
        }

        DeliveryMethod effectiveDelivery = request.deliveryMethod() != null
                ? request.deliveryMethod()
                : order.getDeliveryMethod();

        if (effectiveDelivery == DeliveryMethod.DELIVERY) {
            if (request.addressId() != null) {
                Address address = addressRepository.findByIdAndCustomer_BusinessId(request.addressId(), businessId)
                        .orElseThrow(() -> new EntityNotFoundException("Dirección no encontrada"));

                Long customerId = request.customerId() != null
                        ? request.customerId()
                        : (order.getCustomer() != null ? order.getCustomer().getId() : null);
                if (customerId != null && !address.getCustomer().getId().equals(customerId)) {
                    throw new IllegalArgumentException("La dirección no pertenece al cliente seleccionado");
                }

                order.setAddress(address);
                order.setManualAddress(null);
                if (order.getCustomer() == null) {
                    order.setCustomer(address.getCustomer());
                }
            } else if (request.manualAddress() != null && !request.manualAddress().isBlank()) {
                order.setManualAddress(request.manualAddress().trim());
                order.setAddress(null);
            } else if (request.deliveryMethod() == DeliveryMethod.DELIVERY) {
                boolean hasAddress = order.getAddress() != null
                        || (order.getManualAddress() != null && !order.getManualAddress().isBlank());
                if (!hasAddress) {
                    throw new IllegalArgumentException("Para DELIVERY se requiere addressId o manualAddress");
                }
            }
        }

        recalculateOrderTotal(order, businessId, request.deliveryFee());

        if (request.payments() != null) {
            applyPayments(order, request.payments());
        } else if (request.paymentStatus() == PaymentStatus.PAID && request.paymentMethod() != null) {
            applySinglePayment(order, request.paymentMethod());
        } else if (request.paymentStatus() == PaymentStatus.PENDING) {
            clearPayments(order);
            order.setPaymentMethod(null);
        }

        orderRepository.save(order);

        return orderMapper.toResponse(order);
    }

    private void resetPaymentIfNeeded(Order order) {
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            order.setPaymentStatus(PaymentStatus.PENDING);
            clearPayments(order);
            order.setPaymentMethod(null);
        }
    }

    private void clearPayments(Order order) {
        if (order.getPayments() == null) {
            order.setPayments(new ArrayList<>());
        } else {
            order.getPayments().clear();
        }
    }

    private void applySinglePayment(Order order, PaymentMethod method) {
        clearPayments(order);
        BigDecimal total = order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO;
        order.getPayments().add(OrderPayment.builder()
                .order(order)
                .paymentMethod(method)
                .amount(total)
                .build());
        order.setPaymentMethod(method);
        order.setPaymentStatus(PaymentStatus.PAID);
    }

    private void applyPayments(Order order, List<OrderPaymentRequest> paymentRequests) {
        if (paymentRequests.isEmpty()) {
            clearPayments(order);
            order.setPaymentMethod(null);
            order.setPaymentStatus(PaymentStatus.PENDING);
            return;
        }

        BigDecimal total = order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO;
        BigDecimal sum = BigDecimal.ZERO;
        clearPayments(order);

        for (OrderPaymentRequest req : paymentRequests) {
            if (req.amount() == null || req.amount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Cada pago debe tener un monto mayor a cero");
            }
            sum = sum.add(req.amount());
            order.getPayments().add(OrderPayment.builder()
                    .order(order)
                    .paymentMethod(req.paymentMethod())
                    .amount(req.amount())
                    .build());
        }

        if (sum.compareTo(total) != 0) {
            throw new IllegalArgumentException(
                    "La suma de los pagos debe coincidir con el total del pedido");
        }

        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaymentMethod(resolvePrimaryPaymentMethod(paymentRequests));
    }

    private PaymentMethod resolvePrimaryPaymentMethod(List<OrderPaymentRequest> paymentRequests) {
        if (paymentRequests.size() == 1) {
            return paymentRequests.get(0).paymentMethod();
        }
        return paymentRequests.stream()
                .max(java.util.Comparator.comparing(OrderPaymentRequest::amount))
                .map(OrderPaymentRequest::paymentMethod)
                .orElse(null);
    }
}