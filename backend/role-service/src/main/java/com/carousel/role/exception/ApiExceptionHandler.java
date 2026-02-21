package com.carousel.role.exception;

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
        if (
                "Role not found".equals(message) ||
                "User role assignment not found".equals(message)
        ) {
            return HttpStatus.NOT_FOUND;
        }
        if (
                "Only Admin users can manage roles".equals(message) ||
                "Role is not assigned to user".equals(message)
        ) {
            return HttpStatus.FORBIDDEN;
        }
        if ("Role already exists".equals(message)) {
            return HttpStatus.CONFLICT;
        }
        return HttpStatus.BAD_REQUEST;
    }
}
