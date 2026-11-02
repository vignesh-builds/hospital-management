package com.hospital.management.dto;

public record AdmissionResponse(
        Long id,
        Long patientId,
        String patientName,
        Long bedId,
        String bedNumber,
        String wardType,
        String reason,
        Double dailyRate,
        String admittedAt,
        String dischargedAt,
        Integer billedDays,
        Double roomCharges,
        String status,
        Long billId
) {}
