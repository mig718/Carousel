package com.carousel.styles.exception;

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
                "Style not found".equals(message) ||
                message.startsWith("Inventory item not found for style requirement:")
        ) {
            return HttpStatus.NOT_FOUND;
        }

        if (
                "Insufficient role privileges to access styles".equals(message) ||
                "Insufficient role privileges to manage styles".equals(message)
        ) {
            return HttpStatus.FORBIDDEN;
        }

        if ("Style already exists".equals(message)) {
            return HttpStatus.CONFLICT;
        }

        return HttpStatus.BAD_REQUEST;
    }
}
