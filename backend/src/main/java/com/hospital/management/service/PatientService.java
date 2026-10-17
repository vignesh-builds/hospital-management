package com.hospital.management.service;

import com.hospital.management.exception.BadRequestException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.model.Patient;
import com.hospital.management.model.User;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    public Patient createPatient(Patient patient) {

        validate(patient);

        // Never trust id / user coming from the client
        patient.setId(null);
        patient.setUser(null);

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

        validate(patient);

        Patient existingPatient = getPatientById(id);

        existingPatient.setName(patient.getName().trim());
        existingPatient.setEmail(patient.getEmail());
        existingPatient.setPhone(patient.getPhone());
        existingPatient.setAge(patient.getAge());

        return patientRepository.save(existingPatient);
    }

    @Transactional
    public void deletePatient(Long id) {

        Patient patient = getPatientById(id);

        if (appointmentRepository.existsByPatientId(id)) {
            throw new BadRequestException(
                    "This patient has appointments. Delete them first.");
        }

        User user = patient.getUser();

        patientRepository.delete(patient);

        if (user != null) {
            userRepository.delete(user);
        }
    }

    private void validate(Patient patient) {

        if (patient == null
                || patient.getName() == null || patient.getName().isBlank()) {
            throw new BadRequestException("Patient name is required");
        }

        if (patient.getAge() < 0 || patient.getAge() > 150) {
            throw new BadRequestException("Age must be between 0 and 150");
        }
    }
}
