package com.pizzeria.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pizzeria.backend.dto.combo.ComboRequest;
import com.pizzeria.backend.dto.combo.ComboResponse;
import com.pizzeria.backend.mapper.ComboMapper;
import com.pizzeria.backend.model.Combo;
import com.pizzeria.backend.model.ComboItem;
import com.pizzeria.backend.model.Product;
import com.pizzeria.backend.repository.ComboRepository;
import com.pizzeria.backend.repository.ProductRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ComboService {

    private final ComboRepository comboRepository;
    private final ProductRepository productRepository;
    private final ComboMapper comboMapper;

    @Transactional
    public ComboResponse createCombo(Long businessId, ComboRequest request) {
        // 1. Crear la cabecera del Combo
        Combo combo = Combo.builder()
                .businessId(businessId)
                .name(request.name())
                .price(request.price())
                .active(true)
                .comboItems(new ArrayList<>()) // Inicializamos lista
                .build();

        // 2. Procesar los items (Validar que existan los productos)
        request.items().forEach(itemDto -> {
            Product product = productRepository.findByIdAndBusinessId(itemDto.productId(), businessId)
                    .orElseThrow(() -> new EntityNotFoundException("Producto ID " + itemDto.productId() + " no encontrado o no pertenece a este negocio"));

            // Crear relación
            ComboItem comboItem = ComboItem.builder()
                    .combo(combo)       // Vinculamos al padre
                    .product(product)   // Vinculamos al producto
                    .quantity(itemDto.quantity())
                    .build();

            combo.getComboItems().add(comboItem);
        });

        // 3. Guardar (CascadeType.ALL guardará los items automáticamente)
        Combo savedCombo = comboRepository.save(combo);

        return comboMapper.toResponse(savedCombo);
    }

    @Transactional
    public ComboResponse updateCombo(Long businessId, Long comboId, ComboRequest request) {
        Combo combo = comboRepository.findByIdAndBusinessId(comboId, businessId)
                .orElseThrow(() -> new EntityNotFoundException("Combo no encontrado"));

        combo.setName(request.name());
        combo.setPrice(request.price());
        combo.getComboItems().clear();

        request.items().forEach(itemDto -> {
            Product product = productRepository.findByIdAndBusinessId(itemDto.productId(), businessId)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Producto ID " + itemDto.productId() + " no encontrado o no pertenece a este negocio"));

            ComboItem comboItem = ComboItem.builder()
                    .combo(combo)
                    .product(product)
                    .quantity(itemDto.quantity())
                    .build();

            combo.getComboItems().add(comboItem);
        });

        Combo savedCombo = comboRepository.save(combo);
        return comboMapper.toResponse(savedCombo);
    }

    @Transactional(readOnly = true)
    public List<ComboResponse> getAllCombos(Long businessId) {
        return comboRepository.findByBusinessIdAndActiveTrue(businessId).stream()
                .map(comboMapper::toResponse)
                .toList();
    }

    @Transactional
    public void deleteCombo(Long businessId, Long comboId) {
        Combo combo = comboRepository.findByIdAndBusinessId(comboId, businessId)
                .orElseThrow(() -> new EntityNotFoundException("Combo no encontrado"));
        
        combo.setActive(false);
        comboRepository.save(combo);
    }
}