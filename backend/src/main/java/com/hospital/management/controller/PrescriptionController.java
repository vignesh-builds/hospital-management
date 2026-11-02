package com.hospital.management.controller;

import com.hospital.management.dto.PrescriptionRequest;
import com.hospital.management.dto.PrescriptionResponse;
import com.hospital.management.service.PrescriptionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    /** Create or update the prescription of one of the doctor's own appointments. */
    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping
    public PrescriptionResponse savePrescription(
            @RequestBody PrescriptionRequest request) {
        return prescriptionService.save(request);
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @GetMapping("/appointment/{appointmentId}")
    public PrescriptionResponse getByAppointment(
            @PathVariable Long appointmentId) {
        return prescriptionService.getByAppointment(appointmentId);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/my")
    public List<PrescriptionResponse> getMine() {
        return prescriptionService.getMine();
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @GetMapping("/patient/{patientId}")
    public List<PrescriptionResponse> getByPatient(
            @PathVariable Long patientId) {
        return prescriptionService.getByPatient(patientId);
    }
}
