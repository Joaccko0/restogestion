package com.pizzeria.backend.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pizzeria.backend.dto.auth.AuthenticationResponse;
import com.pizzeria.backend.dto.auth.LoginRequest;
import com.pizzeria.backend.dto.auth.RegisterRequest;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService service;

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(
            @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(service.login(request));
    }

    /**
     * Registro público deshabilitado: los usuarios los crea el SuperAdmin.
     */
    @PostMapping("/register")
    public ResponseEntity<Void> registerDisabled(@RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

}
