package com.pizzeria.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pizzeria.backend.model.OrderPayment;

public interface OrderPaymentRepository extends JpaRepository<OrderPayment, Long> {
}
