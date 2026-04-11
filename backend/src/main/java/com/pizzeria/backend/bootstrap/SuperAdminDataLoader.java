package com.pizzeria.backend.bootstrap;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.pizzeria.backend.model.User;
import com.pizzeria.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Crea el único usuario SuperAdmin en entornos no productivos (credenciales por configuración).
 */
@Slf4j
@Component
@Profile("!prod")
@RequiredArgsConstructor
public class SuperAdminDataLoader implements CommandLineRunner {

    @Value("${app.superadmin.email:superadmin@pizzeria.local}")
    private String email;

    @Value("${app.superadmin.password:superadmin123}")
    private String rawPassword;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        String key = email == null ? "" : email.trim().toLowerCase();
        if (key.isEmpty()) {
            return;
        }
        userRepository.findByEmailIgnoreCase(key).ifPresentOrElse(
                u -> {
                    if (!u.isSuperAdmin()) {
                        log.warn("Usuario {} existe pero no es SuperAdmin; no se modifica.", key);
                    }
                },
                () -> {
                    User admin = User.builder()
                            .firstName("Super")
                            .lastName("Admin")
                            .email(key)
                            .password(passwordEncoder.encode(rawPassword))
                            .superAdmin(true)
                            .roles(List.of())
                            .build();
                    userRepository.save(admin);
                    log.info("Usuario SuperAdmin creado: {}", key);
                }
        );
    }
}
