package com.carousel.flows.exception;

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
                "Flow not found".equals(message) ||
                "Flow state not found".equals(message) ||
                "Flow action not found".equals(message)
        ) {
            return HttpStatus.NOT_FOUND;
        }

        if (
                "Flow name is required".equals(message) ||
                "Flow state name is required".equals(message) ||
                "Action name is required".equals(message) ||
                "Action type is required".equals(message)
        ) {
            return HttpStatus.BAD_REQUEST;
        }

        if (
                "Flow already exists".equals(message) ||
                "State already exists for this flow".equals(message)
        ) {
            return HttpStatus.CONFLICT;
        }

        return HttpStatus.BAD_REQUEST;
    }
}
