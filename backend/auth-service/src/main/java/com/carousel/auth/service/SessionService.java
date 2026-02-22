package com.carousel.auth.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.UUID;

@Service
public class SessionService {

    @Value("${jwt.secret:carousel-secret-key-for-jwt-token-generation-and-validation}")
    private String jwtSecret;

    @Value("${session.jwt.expiration:1800000}")
    private long sessionJwtExpiration;

    public String generateSessionToken(String email, String userId, String accessToken) {
        String sessionId = UUID.randomUUID().toString();
        String accessTokenHash = DigestUtils.sha256Hex(accessToken);

        return Jwts.builder()
                .subject(email)
                .claim("sessionId", sessionId)
                .claim("userId", userId)
                .claim("tokenType", "session")
                .claim("accessTokenHash", accessTokenHash)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + sessionJwtExpiration))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()), SignatureAlgorithm.HS256)
                .compact();
    }
}
