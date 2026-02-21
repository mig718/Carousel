package com.carousel.auth.exception;

import com.fasterxml.jackson.databind.JsonMappingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<String> handleJsonParseError(HttpMessageNotReadableException ex, WebRequest request) {
        logger.error("JSON parse error: {}", ex.getMessage(), ex);
        Throwable cause = ex.getCause();
        if (cause instanceof JsonMappingException) {
            logger.error("Mapping exception: {}", cause.getMessage(), cause);
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("JSON parse error: " + ex.getMessage());
    }
}

