package com.pizzeria.backend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pizzeria.backend.dto.admin.AdminAssignRoleRequest;
import com.pizzeria.backend.dto.admin.AdminCreateUserRequest;
import com.pizzeria.backend.dto.admin.AdminPatchUserRequest;
import com.pizzeria.backend.dto.admin.AdminUserResponse;
import com.pizzeria.backend.dto.admin.AdminUserResponse.AdminUserBusinessRoleResponse;
import com.pizzeria.backend.model.Business;
import com.pizzeria.backend.model.User;
import com.pizzeria.backend.model.UserBusinessRole;
import com.pizzeria.backend.repository.BusinessRepository;
import com.pizzeria.backend.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> listAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getById(Long id) {
        return userRepository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }

    @Transactional
    public AdminUserResponse createTenant(AdminCreateUserRequest req) {
        String email = normalizeEmail(req.email());
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("El email ya está registrado");
        }
        User user = User.builder()
                .email(email)
                .firstName(req.firstName().trim())
                .lastName(req.lastName().trim())
                .password(passwordEncoder.encode(req.password()))
                .superAdmin(false)
                .roles(new ArrayList<>())
                .build();
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse patchUser(Long id, AdminPatchUserRequest req) {
        User user = userRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        if (user.isSuperAdmin()) {
            throw new IllegalArgumentException("No se editan datos del SuperAdmin desde este endpoint");
        }
        if (req.firstName() != null && !req.firstName().isBlank()) {
            user.setFirstName(req.firstName().trim());
        }
        if (req.lastName() != null && !req.lastName().isBlank()) {
            user.setLastName(req.lastName().trim());
        }
        if (req.password() != null && !req.password().isBlank()) {
            if (req.password().length() < 6) {
                throw new IllegalArgumentException("La contraseña debe tener al menos 6 caracteres");
            }
            user.setPassword(passwordEncoder.encode(req.password()));
        }
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse assignRole(Long userId, AdminAssignRoleRequest req) {
        User user = userRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        if (user.isSuperAdmin()) {
            throw new IllegalArgumentException("El SuperAdmin no tiene roles de negocio");
        }
        Business business = businessRepository.findById(req.businessId())
                .orElseThrow(() -> new EntityNotFoundException("Negocio no encontrado"));

        List<UserBusinessRole> roles = user.getRoles();
        if (roles == null) {
            roles = new ArrayList<>();
            user.setRoles(roles);
        }
        roles.removeIf(r -> Objects.equals(r.getBusinessId(), business.getId()));
        UserBusinessRole link = UserBusinessRole.builder()
                .user(user)
                .businessId(business.getId())
                .role(req.role())
                .build();
        roles.add(link);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse removeRole(Long userId, Long businessId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        if (user.getRoles() == null) {
            return toResponse(user);
        }
        user.getRoles().removeIf(r -> Objects.equals(r.getBusinessId(), businessId));
        return toResponse(userRepository.save(user));
    }

    private AdminUserResponse toResponse(User user) {
        List<AdminUserBusinessRoleResponse> br = new ArrayList<>();
        if (user.getRoles() != null) {
            for (UserBusinessRole r : user.getRoles()) {
                String bname = businessRepository.findById(r.getBusinessId())
                        .map(Business::getName)
                        .orElse("?");
                br.add(new AdminUserBusinessRoleResponse(r.getId(), r.getBusinessId(), bname, r.getRole()));
            }
        }
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.isSuperAdmin(),
                br
        );
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
