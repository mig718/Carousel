package com.carousel.user.session;

import com.carousel.user.domain.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class SessionService {
    private static final long SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes
    private final javax.crypto.SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        claims.put("accessLevel", user.getAccessLevel().name());
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + SESSION_DURATION_MS))
                .signWith(key)
                .compact();
    }

    public Jws<Claims> parseToken(String token) {
        // jjwt 0.12.x: use parser() and parseSignedClaims
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token);
    }

    public boolean isTokenExpired(String token) {
        try {
            Date expiration = parseToken(token).getBody().getExpiration();
            return expiration.before(new Date());
        } catch (JwtException e) {
            return true;
        }
    }

    public String extendToken(String token) {
        Jws<Claims> jws = parseToken(token);
        Claims claims = jws.getBody();
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(claims.getSubject())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + SESSION_DURATION_MS))
                .signWith(key)
                .compact();
    }

    public String getEmailFromToken(String token) {
        return parseToken(token).getBody().get("email", String.class);
    }

    public String getAccessLevelFromToken(String token) {
        return parseToken(token).getBody().get("accessLevel", String.class);
    }
}

