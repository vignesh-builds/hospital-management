package com.hospital.management.dto;

public record PrescriptionResponse(
        Long id,
        Long appointmentId,
        String appointmentDate,
        String appointmentTime,
        Long patientId,
        String patientName,
        Integer patientAge,
        String patientGender,
        Long doctorId,
        String doctorName,
        String specialization,
        String qualification,
        String vitals,
        String symptoms,
        String diagnosis,
        String medicines,
        String advice,
        Double medicineCharges,
        String createdAt
) {}
