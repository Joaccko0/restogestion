package com.pizzeria.backend.model;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.pizzeria.backend.model.enums.BusinessBillingStatus;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "businesses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Business {
    // NO extiende BaseEntity porque Business no pertenece a otro Business

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BusinessBillingStatus billingStatus = BusinessBillingStatus.GRATIS;

    /** Obligatorio si el negocio no es GRATIS (fin de período pagado). */
    private LocalDate expiresAt;

    /** Costo de envío delivery (se suma al total del pedido). */
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal deliveryFee = BigDecimal.ZERO;
}
