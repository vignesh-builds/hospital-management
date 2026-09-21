package com.hospital.management.exception;

public class AppointmentValidationException extends RuntimeException {

    public AppointmentValidationException(String message) {
        super(message);
    }
}