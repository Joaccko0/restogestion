package com.pizzeria.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pizzeria.backend.model.MenuCategory;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {

    List<MenuCategory> findByBusinessIdOrderByNameAsc(Long businessId);

    Optional<MenuCategory> findByIdAndBusinessId(Long id, Long businessId);

    Optional<MenuCategory> findByBusinessIdAndCode(Long businessId, String code);

    boolean existsByBusinessIdAndCode(Long businessId, String code);
}
