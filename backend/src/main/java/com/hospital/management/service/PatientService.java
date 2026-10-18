
package com.hospital.management.service;

import com.hospital.management.exception.BadRequestException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.model.Patient;
import com.hospital.management.model.User;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final SecureRandom SECURE_RANDOM =
            new SecureRandom();

    private static final String PASSWORD_CHARACTERS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
            + "23456789@#$%";

    @Transactional
    public Patient createPatient(Patient patient) {

        validate(patient);

        String email = patient.getEmail();

        if (email == null || email.isBlank()) {
            throw new BadRequestException(
                    "Patient email is required to create a login account");
        }

        email = email.trim();

        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BadRequestException(
                    "An account with this email already exists");
        }

        if (patientRepository.findAll().stream()
                .anyMatch(existing ->
                        existing.getEmail() != null
                                && existing.getEmail().equalsIgnoreCase(email))) {
            throw new BadRequestException(
                    "A patient with this email already exists");
        }

        // Generate a temporary password
        String temporaryPassword = generateTemporaryPassword();

        // Create the patient's login account
        User user = new User();
        user.setName(patient.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setRole("PATIENT");
        user.setMustChangePassword(true);

        User savedUser = userRepository.save(user);

        // Link the patient record to the login account
        patient.setId(null);
        patient.setName(patient.getName().trim());
        patient.setEmail(email);
        patient.setUser(savedUser);

        Patient savedPatient = patientRepository.save(patient);

        /*
         * The temporary password is intentionally NOT returned
         * from this method or saved as plain text.
         * The controller must use a dedicated one-time response
         * to securely deliver it to the authorized admin.
         */

        return savedPatient;
    }

    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    public Patient getPatientById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Patient not found"));
    }

    @Transactional
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

        // Delete only the login account linked to this patient.
        if (user != null) {
            userRepository.delete(user);
        }
    }

    private String generateTemporaryPassword() {

        int length = 14;
        StringBuilder password = new StringBuilder(length);

        for (int i = 0; i < length; i++) {
            int index = SECURE_RANDOM.nextInt(
                    PASSWORD_CHARACTERS.length());

            password.append(PASSWORD_CHARACTERS.charAt(index));
        }

        return password.toString();
    }

    private void validate(Patient patient) {

        if (patient == null
                || patient.getName() == null
                || patient.getName().isBlank()) {
            throw new BadRequestException(
                    "Patient name is required");
        }

        if (patient.getAge() < 0 || patient.getAge() > 150) {
            throw new BadRequestException(
                    "Age must be between 0 and 150");
        }
    }
}
