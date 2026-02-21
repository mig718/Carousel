package com.carousel.user.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        HttpStatus status = mapStatus(ex.getMessage());
        return ResponseEntity.status(status).body(Map.of("message", ex.getMessage()));
    }

    private HttpStatus mapStatus(String message) {
        if (message == null) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }
        switch (message) {
            case "Email already registered":
            case "Invalid verification token":
                return HttpStatus.BAD_REQUEST;
            case "Registration already pending for this email":
            case "Email not verified":
                return HttpStatus.CONFLICT;
            case "Pending user not found":
            case "User not found":
                return HttpStatus.NOT_FOUND;
            case "Insufficient privileges to create users":
            case "Insufficient privileges to update users":
            case "Insufficient privileges to delete users":
            case "Insufficient privileges to list users":
            case "Only Admin users can create Admin users":
            case "Only Admin users can assign Admin access level":
            case "Cannot downgrade Admin users":
            case "Cannot delete other Admin users":
                return HttpStatus.FORBIDDEN;
            default:
                // Only return 401 for exact 'Not authenticated', 403 for all other access control errors
                if (message != null) {
                    if (message.equals("Not authenticated")) {
                        return HttpStatus.UNAUTHORIZED;
                    }
                    String lower = message.toLowerCase();
                    if (lower.contains("privilege") || lower.contains("admin") || lower.contains("access")) {
                        return HttpStatus.FORBIDDEN;
                    }
                }
                return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }
}

