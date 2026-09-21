package com.hospital.management.controller;

import com.hospital.management.model.Doctor;
import com.hospital.management.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/doctors")
    public Doctor createDoctor(@RequestBody Doctor doctor){
        return doctorService.createDoctor(doctor);
    }

    @GetMapping("/doctors")
    public List<Doctor> getAllDoctors() {
        return doctorService.getAllDoctors();
    }

    @GetMapping("/doctors/{id}")
    public Doctor getDoctorById(@PathVariable Long id) {
        return doctorService.getDoctorById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/doctors/{id}")
    public Doctor updateDoctor(
            @PathVariable Long id,
            @RequestBody Doctor doctor) {
        return doctorService.updateDoctor(id, doctor);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/doctors/{id}")
    public void deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
    }
}
