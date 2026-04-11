package com.pizzeria.backend.bootstrap;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.pizzeria.backend.model.Business;
import com.pizzeria.backend.model.User;
import com.pizzeria.backend.model.UserBusinessRole;
import com.pizzeria.backend.model.enums.Role;
import com.pizzeria.backend.repository.BusinessRepository;
import com.pizzeria.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Crea o actualiza el usuario demo y su negocio (OWNER).
 * Si el email ya existia (p. ej. por registro previo), vuelve a fijar la contrasena
 * a {@link #SEED_PASSWORD} para que el login con credenciales demo siga funcionando.
 */
@Slf4j
@Component
@Profile("!prod")
@RequiredArgsConstructor
public class HardcodedUserDataLoader implements CommandLineRunner {

    /** Email para login (POST /api/auth/login) */
    public static final String SEED_EMAIL = "owner@pizzeria.local";

    /** Contrasena en texto plano (solo para desarrollo local) */
    public static final String SEED_PASSWORD = "password123";

    public static final String SEED_FIRST_NAME = "Owner";
    public static final String SEED_LAST_NAME = "Demo";

    /** Nombre del negocio creado y vinculado como OWNER */
    public static final String SEED_BUSINESS_NAME = "Pizzeria Demo";

    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        userRepository.findByEmailIgnoreCase(SEED_EMAIL).ifPresentOrElse(this::syncExistingSeedUser, this::insertSeedUser);
    }

    private void syncExistingSeedUser(User user) {
        user.setPassword(passwordEncoder.encode(SEED_PASSWORD));
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            Business business = businessRepository.save(
                    Business.builder().name(SEED_BUSINESS_NAME).build());
            UserBusinessRole link = UserBusinessRole.builder()
                    .user(user)
                    .businessId(business.getId())
                    .role(Role.OWNER)
                    .build();
            user.setRoles(List.of(link));
        }
        userRepository.save(user);
        log.info("Usuario demo actualizado: {} (contrasena alineada con SEED_PASSWORD)", SEED_EMAIL);
    }

    private void insertSeedUser() {
        Business business = businessRepository.save(
                Business.builder()
                        .name(SEED_BUSINESS_NAME)
                        .build());

        User user = User.builder()
                .firstName(SEED_FIRST_NAME)
                .lastName(SEED_LAST_NAME)
                .email(SEED_EMAIL)
                .password(passwordEncoder.encode(SEED_PASSWORD))
                .build();

        UserBusinessRole link = UserBusinessRole.builder()
                .user(user)
                .businessId(business.getId())
                .role(Role.OWNER)
                .build();

        user.setRoles(List.of(link));
        userRepository.save(user);
        log.info("Usuario demo creado: {} / negocio: {}", SEED_EMAIL, SEED_BUSINESS_NAME);
    }
}
