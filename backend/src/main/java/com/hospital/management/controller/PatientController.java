package com.hospital.management.controller;

import com.hospital.management.model.Patient;
import com.hospital.management.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/patients")
    public Patient createPatient(@RequestBody Patient patient){
        return patientService.createPatient(patient);
    }

    @GetMapping("/patients")
    public List<Patient> getAllpatients(){
        return patientService.getAllPatients();
    }

    @GetMapping("/patients/{id}")
    public Patient getPatientById(@PathVariable Long id){
        return patientService.getPatientById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/patients/{id}")
    public Patient updatePatient(@PathVariable Long id, @RequestBody Patient patient){
        return patientService.updatePatient(id, patient);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/patients/{id}")
    public void deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
    }
}
