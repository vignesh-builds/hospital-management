package com.hospital.management.controller;

import com.hospital.management.dto.AdmissionResponse;
import com.hospital.management.dto.AdmitRequest;
import com.hospital.management.service.AdmissionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admissions")
public class AdmissionController {

    private final AdmissionService admissionService;

    public AdmissionController(AdmissionService admissionService) {
        this.admissionService = admissionService;
    }

    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN','RECEPTIONIST','WARD_IN_CHARGE')")
    @PostMapping
    public AdmissionResponse admit(@RequestBody AdmitRequest request) {
        return admissionService.admit(request);
    }

    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN','RECEPTIONIST','WARD_IN_CHARGE')")
    @PutMapping("/{id}/discharge")
    public AdmissionResponse discharge(@PathVariable Long id) {
        return admissionService.discharge(id);
    }

    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN','RECEPTIONIST','NURSE','WARD_IN_CHARGE')")
    @GetMapping
    public List<AdmissionResponse> getAll() {
        return admissionService.getAll();
    }

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/my")
    public List<AdmissionResponse> getMine() {
        return admissionService.getMine();
    }
}
