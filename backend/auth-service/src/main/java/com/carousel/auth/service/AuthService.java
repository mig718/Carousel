package com.carousel.auth.service;

import com.carousel.auth.domain.Credential;
import com.carousel.auth.dto.LoginRequest;
import com.carousel.auth.dto.LoginResponse;
import com.carousel.auth.repository.CredentialRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.Optional;

@Service
public class AuthService {
    private final CredentialRepository credentialRepository;

    @Value("${jwt.secret:carousel-secret-key-for-jwt-token-generation-and-validation}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    public AuthService(CredentialRepository credentialRepository) {
        this.credentialRepository = credentialRepository;
    }

    public LoginResponse login(LoginRequest request) {
        Optional<Credential> credential = credentialRepository.findByEmail(request.getEmail());
        
        if (credential.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        String passwordHash = DigestUtils.sha256Hex(request.getPassword());
        if (!credential.get().getPasswordHash().equals(passwordHash)) {
            throw new RuntimeException("Invalid password. Request pwd: " + request.getPassword() + ", Hash: " + passwordHash + ", Stored hash: " + credential.get().getPasswordHash());
        }

        String token = generateToken(credential.get().getEmail(), credential.get().getId());
        return LoginResponse.builder()
                .token(token)
                .userId(credential.get().getId())
                .email(credential.get().getEmail())
                .build();
    }

    public void createCredential(String email, String password) {
        Optional<Credential> existing = credentialRepository.findByEmail(email);
        if (existing.isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        String passwordHash = DigestUtils.sha256Hex(password);
        Credential credential = Credential.builder()
                .email(email)
                .passwordHash(passwordHash)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        credentialRepository.save(credential);
    }

    public String generateToken(String email, String userId) {
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token, String email) {
        try {
            var claims = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getSubject().equals(email);
        } catch (Exception e) {
            return false;
        }
    }
}

