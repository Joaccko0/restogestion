package com.pizzeria.backend.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad que representa la apertura y cierre de caja en un negocio.
 * 
 * Una CashShift agrupa los pedidos que se realizan durante un período de trabajo
 * (ej: 20:00 a 02:00 del día siguiente en una pizzería).
 * 
 * Attributes:
 * - id: Identificador único
 * - businessId: Referencia al negocio (multi-tenancy)
 * - status: OPEN (caja abierta) o CLOSED (caja cerrada)
 * - startDate: Fecha y hora de apertura de caja
 * - endDate: Fecha y hora de cierre (null si está abierta)
 * - startAmount: Dinero inicial en la caja
 * - endAmount: Dinero final después del cierre (null si está abierta)
 */
@Entity
@Table(name = "cash_shifts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashShift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Referencia al negocio (multi-tenancy)
     */
    @Column(name = "business_id", nullable = false)
    private Long businessId;

    /**
     * Estado de la caja: OPEN o CLOSED
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CashShiftStatus status;

    /**
     * Fecha y hora de apertura de caja
     */
    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    /**
     * Fecha y hora de cierre de caja (nullable si está abierta)
     */
    @Column(name = "end_date")
    private LocalDateTime endDate;

    /**
     * Dinero inicial en la caja
     */
    @Column(name = "start_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal startAmount;

    /**
     * Dinero final en la caja después del cierre (nullable si está abierta)
     */
    @Column(name = "end_amount", precision = 10, scale = 2)
    private BigDecimal endAmount;

    /** Total recaudado reportado manualmente al cerrar (opcional). */
    @Column(name = "manual_total_collected", precision = 10, scale = 2)
    private BigDecimal manualTotalCollected;

    /** JSON: [{ "category": "PIZZAS", "amount": 1000.00, "quantity": 12 }, ...] */
    @Column(name = "manual_category_sales", columnDefinition = "TEXT")
    private String manualCategorySales;

    /** JSON: [{ "method": "CASH", "amount": 500.00 }, ...] */
    @Column(name = "manual_payment_breakdown", columnDefinition = "TEXT")
    private String manualPaymentBreakdown;

    /**
     * Auditoría: fecha de creación
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Auditoría: fecha de última actualización
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Enum para el estado de la caja
     */
    public enum CashShiftStatus {
        OPEN,    // Caja abierta, aceptando pedidos
        CLOSED   // Caja cerrada, no hay pedidos nuevos
    }
}
