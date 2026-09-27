package com.hospital.management.controller;

import com.hospital.management.model.Doctor;
import com.hospital.management.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:3000",
        "https://hospital-frontend-7jfj.onrender.com"
})
public class DoctorController {

    @Autowired
    private DoctorService doctorService;


    // =========================================================
    // CREATE DOCTOR - ADMIN ONLY
    // =========================================================

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/doctors")
    public Doctor createDoctor(
            @RequestBody Doctor doctor) {

        return doctorService.createDoctor(doctor);
    }


    // =========================================================
    // GET ALL DOCTORS - PUBLIC
    // =========================================================

    @GetMapping("/doctors")
    public List<Doctor> getAllDoctors() {

        return doctorService.getAllDoctors();
    }


    // =========================================================
    // GET DOCTOR BY ID - PUBLIC
    // =========================================================

    @GetMapping("/doctors/{id}")
    public Doctor getDoctorById(
            @PathVariable Long id) {

        return doctorService.getDoctorById(id);
    }


    // =========================================================
    // UPDATE DOCTOR - ADMIN ONLY
    // =========================================================

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/doctors/{id}")
    public Doctor updateDoctor(
            @PathVariable Long id,
            @RequestBody Doctor doctor) {

        return doctorService.updateDoctor(
                id,
                doctor
        );
    }


    // =========================================================
    // DELETE DOCTOR - ADMIN ONLY
    // =========================================================

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/doctors/{id}")
    public void deleteDoctor(
            @PathVariable Long id) {

        doctorService.deleteDoctor(id);
    }
}
