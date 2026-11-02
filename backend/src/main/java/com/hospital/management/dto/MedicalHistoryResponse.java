package com.hospital.management.dto;

import com.hospital.management.model.Bill;

import java.util.List;

public record MedicalHistoryResponse(
        PatientInfo patient,
        List<Visit> visits,
        List<PrescriptionResponse> prescriptions,
        List<AdmissionResponse> admissions,
        boolean billingVisible,
        List<Bill> bills
) {
    public record PatientInfo(
            Long id,
            String name,
            int age,
            String gender,
            String phone,
            String email,
            String address
    ) {}

    public record Visit(
            Long appointmentId,
            String date,
            String time,
            String status,
            String doctorName,
            String specialization,
            boolean hasPrescription
    ) {}
}
