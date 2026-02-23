package com.carousel.inventory.exception;

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
                "Resource type not found".equals(message) ||
                "Resource subtype not found".equals(message) ||
                "Parent type not found".equals(message) ||
                "Inventory item not found".equals(message)
        ) {
            return HttpStatus.NOT_FOUND;
        }

        if (
                "Insufficient role privileges to manage inventory".equals(message) ||
                "Insufficient role privileges to manage resource types".equals(message)
        ) {
            return HttpStatus.FORBIDDEN;
        }

        if ("Resource type already exists".equals(message)) {
            return HttpStatus.CONFLICT;
        }

        return HttpStatus.BAD_REQUEST;
    }
}
