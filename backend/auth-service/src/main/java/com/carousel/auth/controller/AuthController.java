package com.carousel.auth.controller;

import com.carousel.auth.dto.LoginRequest;
import com.carousel.auth.dto.LoginResponse;
import com.carousel.auth.dto.RegisterCredentialRequest;
import com.carousel.auth.dto.ValidateTokenRequest;
import com.carousel.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@ControllerAdvice
@RestController
@RequestMapping
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticate user with email and password")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    @Operation(summary = "Register credentials", description = "Create credentials for a user")
    public ResponseEntity<String> register(@RequestBody RegisterCredentialRequest request) {
        authService.createCredential(request.getEmail(), request.getPassword());
        return ResponseEntity.ok("Credentials created successfully");
    }

    @PostMapping("/validate")
    @Operation(summary = "Validate token", description = "Validate JWT token")
    public ResponseEntity<Boolean> validateToken(@RequestBody ValidateTokenRequest request) {
        boolean isValid = authService.validateToken(request.getToken(), request.getEmail());
        return ResponseEntity.ok(isValid);
    }
}

