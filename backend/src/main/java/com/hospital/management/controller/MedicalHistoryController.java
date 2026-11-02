package com.hospital.management.controller;

import com.hospital.management.dto.MedicalHistoryResponse;
import com.hospital.management.service.MedicalHistoryService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/history")
public class MedicalHistoryController {

    private final MedicalHistoryService historyService;

    public MedicalHistoryController(MedicalHistoryService historyService) {
        this.historyService = historyService;
    }

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/my")
    public MedicalHistoryResponse myHistory() {
        return historyService.getMine();
    }

    /** ADMIN, or a DOCTOR who has treated the patient. */
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @GetMapping("/patient/{patientId}")
    public MedicalHistoryResponse patientHistory(@PathVariable Long patientId) {
        return historyService.getForPatient(patientId);
    }
}
