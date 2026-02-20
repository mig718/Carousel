package com.carousel.user.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuthenticationInterceptor implements HandlerInterceptor {

    @Value("${jwt.secret:carousel-secret-key-for-jwt-token-generation-and-validation}")
    private String jwtSecret;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        
        // Skip for public endpoints
        String requestUri = request.getRequestURI();
        if (isPublicEndpoint(requestUri)) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return true; // Let Spring Security handle authentication
        }

        String token = authHeader.substring(7);
        try {
            var claims = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            String email = claims.getSubject();
            String userId = claims.get("userId", String.class);
            
            // For now, we'll fetch access level from database if needed
            // This is handled in UserController via the X-User-Access-Level header
            
        } catch (Exception e) {
            // Token parsing failed, let Spring Security handle it
        }

        return true;
    }

    private boolean isPublicEndpoint(String uri) {
        return uri.contains("/swagger-ui") ||
               uri.contains("/v3/api-docs") ||
               uri.contains("/health") ||
               uri.contains("/register") ||
               uri.contains("/verify");
    }
}

