package com.carousel.auth;

import com.carousel.auth.domain.Credential;
import com.carousel.auth.dto.LoginRequest;
import com.carousel.auth.repository.CredentialRepository;
import com.carousel.auth.service.AuthService;
import org.apache.commons.codec.digest.DigestUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AuthServiceTest {
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private CredentialRepository credentialRepository;

    @BeforeEach
    public void setUp() {
        credentialRepository.deleteAll();
    }

    @Test
    public void testCreateCredential() {
        authService.createCredential("test@example.com", "password123");
        
        var credential = credentialRepository.findByEmail("test@example.com");
        assertTrue(credential.isPresent());
        assertEquals("test@example.com", credential.get().getEmail());
    }

    @Test
    public void testLoginSuccess() {
        authService.createCredential("test@example.com", "password123");
        
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("password123")
                .build();
        
        var response = authService.login(request);
        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("test@example.com", response.getEmail());
    }

    @Test
    public void testLoginFailureUserNotFound() {
        LoginRequest request = LoginRequest.builder()
                .email("nonexistent@example.com")
                .password("password123")
                .build();
        
        assertThrows(RuntimeException.class, () -> authService.login(request));
    }

    @Test
    public void testLoginFailureWrongPassword() {
        authService.createCredential("test@example.com", "password123");
        
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("wrongpassword")
                .build();
        
        assertThrows(RuntimeException.class, () -> authService.login(request));
    }

    @Test
    public void testTokenGeneration() {
        String token = authService.generateToken("test@example.com", "123");
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    public void testTokenValidation() {
        String token = authService.generateToken("test@example.com", "123");
        boolean isValid = authService.validateToken(token, "test@example.com");
        assertTrue(isValid);
    }

    @Test
    public void testTokenValidationFailureWrongEmail() {
        String token = authService.generateToken("test@example.com", "123");
        boolean isValid = authService.validateToken(token, "wrong@example.com");
        assertFalse(isValid);
    }

    @Test
    public void testDuplicateEmailRegistration() {
        authService.createCredential("test@example.com", "password123");
        assertThrows(RuntimeException.class, () -> 
            authService.createCredential("test@example.com", "password456")
        );
    }
}

