package com.pizzeria.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(
    name = "menu_categories",
    uniqueConstraints = @UniqueConstraint(columnNames = { "business_id", "code" })
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class MenuCategory extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    /** Identificador estable usado en productos y cierre de caja (ej. PIZZAS). */
    @Column(nullable = false, length = 50)
    private String code;

    @Builder.Default
    @Column(nullable = false)
    private boolean systemDefault = false;
}
