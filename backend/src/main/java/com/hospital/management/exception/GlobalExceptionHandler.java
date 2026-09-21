package com.hospital.management.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {


    // ==========================================
    // 404
    // ==========================================

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>>
    handleResourceNotFound(
            ResourceNotFoundException exception) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                exception.getMessage()
        );
    }


    // ==========================================
    // 409
    // ==========================================

    @ExceptionHandler(
            AppointmentAlreadyBookedException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleAppointmentAlreadyBooked(
            AppointmentAlreadyBookedException exception) {

        return buildResponse(
                HttpStatus.CONFLICT,
                exception.getMessage()
        );
    }


    // ==========================================
    // 400
    // ==========================================

    @ExceptionHandler(
            AppointmentValidationException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleAppointmentValidation(
            AppointmentValidationException exception) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                exception.getMessage()
        );
    }


    // ==========================================
    // RUNTIME EXCEPTION
    // ==========================================

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>>
    handleRuntimeException(
            RuntimeException exception) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                exception.getMessage()
        );
    }


    // ==========================================
    // GENERIC EXCEPTION
    // ==========================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>>
    handleException(
            Exception exception) {

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Something went wrong"
        );
    }


    // ==========================================
    // RESPONSE BUILDER
    // ==========================================

    private ResponseEntity<Map<String, Object>>
    buildResponse(
            HttpStatus status,
            String message) {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "timestamp",
                LocalDateTime.now()
        );

        response.put(
                "status",
                status.value()
        );

        response.put(
                "error",
                status.getReasonPhrase()
        );

        response.put(
                "message",
                message
        );


        return ResponseEntity
                .status(status)
                .body(response);
    }
}