package com.hospital.management.controller;

import com.hospital.management.dto.AvailableSlotDTO;
import com.hospital.management.model.DoctorAvailability;
import com.hospital.management.service.DoctorAvailabilityService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/availability")
public class DoctorAvailabilityController {

    @Autowired
    private DoctorAvailabilityService doctorAvailabilityService;


    // =========================================================
    // CREATE
    // =========================================================

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @PostMapping
    public DoctorAvailability createAvailability(
            @RequestBody DoctorAvailability availability) {

        return doctorAvailabilityService
                .createAvailability(availability);
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @GetMapping
    public List<DoctorAvailability> getAllAvailability() {

        return doctorAvailabilityService
                .getAllAvailability();
    }


    // =========================================================
    // GET BY DOCTOR
    // =========================================================

    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @GetMapping("/doctor/{doctorId}")
    public List<DoctorAvailability> getAvailabilityByDoctor(
            @PathVariable Long doctorId) {

        return doctorAvailabilityService
                .getAvailabilityByDoctor(doctorId);
    }


    // =========================================================
    // GET BY DOCTOR AND DATE
    // =========================================================

    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @GetMapping("/doctor/{doctorId}/date/{date}")
    public List<DoctorAvailability>
    getAvailabilityByDoctorAndDate(
            @PathVariable Long doctorId,
            @PathVariable LocalDate date) {

        return doctorAvailabilityService
                .getAvailabilityByDoctorAndDate(
                        doctorId,
                        date
                );
    }


    // =========================================================
    // GET AVAILABLE SLOTS
    // =========================================================

    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @GetMapping("/doctor/{doctorId}/date/{date}/slots")
    public List<AvailableSlotDTO> getAvailableSlots(
            @PathVariable Long doctorId,
            @PathVariable LocalDate date) {

        return doctorAvailabilityService
                .getAvailableSlots(
                        doctorId,
                        date
                );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @GetMapping("/{id}")
    public DoctorAvailability getAvailabilityById(
            @PathVariable Long id) {

        return doctorAvailabilityService
                .getAvailabilityById(id);
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @PutMapping("/{id}")
    public DoctorAvailability updateAvailability(
            @PathVariable Long id,
            @RequestBody DoctorAvailability availability) {

        return doctorAvailabilityService
                .updateAvailability(
                        id,
                        availability
                );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void deleteAvailability(
            @PathVariable Long id) {

        doctorAvailabilityService
                .deleteAvailability(id);
    }
}