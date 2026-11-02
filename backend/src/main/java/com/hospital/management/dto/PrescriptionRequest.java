package com.hospital.management.dto;

public record PrescriptionRequest(
        Long appointmentId,
        String vitals,
        String symptoms,
        String diagnosis,
        String medicines,
        String advice,
        Double medicineCharges
) {}
