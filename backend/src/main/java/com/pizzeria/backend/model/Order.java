package com.pizzeria.backend.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.pizzeria.backend.model.enums.DeliveryMethod;
import com.pizzeria.backend.model.enums.OrderStatus;
import com.pizzeria.backend.model.enums.PaymentMethod;
import com.pizzeria.backend.model.enums.PaymentStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class Order extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id") // Nullable (Cliente anónimo)
    private Customer customer;

    // Referencia a la caja (CashShift) con la que se creó este pedido
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cash_shift_id", nullable = false)
    private CashShift cashShift;

    // Dirección de entrega (solo para DELIVERY)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;

    // Dirección manual de texto (alternativa a address para DELIVERY sin cliente)
    @Column(length = 500)
    private String manualAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus orderStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod; // Nullable hasta que paguen

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryMethod deliveryMethod;

    @Column(precision = 10, scale = 2)
    private BigDecimal deliveryFee;

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderPayment> payments = new ArrayList<>();
}
