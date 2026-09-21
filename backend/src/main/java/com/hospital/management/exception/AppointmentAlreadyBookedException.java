package com.hospital.management.exception;

public class AppointmentAlreadyBookedException extends RuntimeException {

    public AppointmentAlreadyBookedException(String message) {
        super(message);
    }
}