package com.pizzeria.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pizzeria.backend.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // SQL generado: SELECT * FROM products WHERE business_id = ?
    List<Product> findByBusinessId(Long businessId);

    // SQL generado: SELECT * FROM products WHERE id = ? AND business_id = ?
    Optional<Product> findByIdAndBusinessId(Long id, Long businessId);

    // SQL generado: SELECT * FROM products WHERE business_id = ? AND active = true
    List<Product> findByBusinessIdAndActiveTrue(Long businessId);

    long countByBusinessIdAndCategory(Long businessId, String category);
}
