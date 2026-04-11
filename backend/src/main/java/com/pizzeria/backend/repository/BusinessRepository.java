package com.pizzeria.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pizzeria.backend.model.Business;

public interface BusinessRepository extends JpaRepository<Business, Long> {
}
