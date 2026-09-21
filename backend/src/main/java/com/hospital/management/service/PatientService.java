package com.hospital.management.service;

import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.model.Patient;
import com.hospital.management.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    public Patient createPatient(Patient patient) {
        return patientRepository.save(patient);
    }

    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    public Patient getPatientById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Patient not found"));
    }

    public Patient updatePatient(Long id, Patient patient) {

        Patient existingPatient = patientRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Patient not found"));

        existingPatient.setName(patient.getName());
        existingPatient.setEmail(patient.getEmail());
        existingPatient.setPhone(patient.getPhone());
        existingPatient.setAge(patient.getAge());

        return patientRepository.save(existingPatient);
    }

    public void deletePatient(Long id) {

        if (!patientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patient not found");
        }

        patientRepository.deleteById(id);
    }
}