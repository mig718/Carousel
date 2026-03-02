package com.carousel.gateway.audit;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Component
public class JwtIdentityService {

    @Value("${jwt.secret:carousel-secret-key-for-jwt-token-generation-and-validation}")
    private String jwtSecret;

    public Optional<String> extractEmail(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return Optional.empty();
        }

        String token = authorizationHeader.substring(7);
        try {
            String subject = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();

            if (subject == null || subject.isBlank()) {
                return Optional.empty();
            }

            return Optional.of(subject);
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
