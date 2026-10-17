package com.hospital.management.service;

import com.hospital.management.exception.BadRequestException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.model.Doctor;
import com.hospital.management.model.DoctorAvailability;
import com.hospital.management.model.User;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.DoctorAvailabilityRepository;
import com.hospital.management.repository.DoctorRepository;
import com.hospital.management.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DoctorService {

    private static final String EMAIL_PATTERN = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorAvailabilityRepository doctorAvailabilityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;


    /**
     * Creates a doctor. If the request contains user.email and user.password,
     * a DOCTOR login account is created and linked to the doctor too.
     */
    @Transactional
    public Doctor createDoctor(Doctor doctor) {

        validate(doctor);

        doctor.setId(null);

        User input = doctor.getUser();

        if (input != null
                && input.getEmail() != null
                && !input.getEmail().isBlank()) {

            String email = input.getEmail().trim().toLowerCase();

            if (!email.matches(EMAIL_PATTERN)) {
                throw new BadRequestException("Please enter a valid login email");
            }

            if (input.getPassword() == null
                    || input.getPassword().length() < 6) {
                throw new BadRequestException(
                        "Doctor login password must be at least 6 characters");
            }

            if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
                throw new BadRequestException("Email already registered");
            }

            User user = new User();
            user.setName(doctor.getName().trim());
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(input.getPassword()));
            user.setRole("DOCTOR");

            doctor.setUser(userRepository.save(user));

        } else {
            doctor.setUser(null);
        }

        return doctorRepository.save(doctor);
    }

    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    public Doctor getDoctorById(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Doctor not found"));
    }

    public Doctor getLoggedInDoctor() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        return doctorRepository.findByUserId(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Doctor profile not found"));
    }

    public Doctor updateDoctor(Long id, Doctor doctor) {

        validate(doctor);

        Doctor existingDoctor = getDoctorById(id);

        existingDoctor.setName(doctor.getName().trim());
        existingDoctor.setSpecialization(doctor.getSpecialization().trim());
        existingDoctor.setPhone(doctor.getPhone());

        return doctorRepository.save(existingDoctor);
    }

    @Transactional
    public void deleteDoctor(Long id) {

        Doctor doctor = getDoctorById(id);

        if (appointmentRepository.existsByDoctorId(id)) {
            throw new BadRequestException(
                    "This doctor has appointments. Delete or reassign them first.");
        }

        List<DoctorAvailability> availabilities =
                doctorAvailabilityRepository.findByDoctorId(id);
        doctorAvailabilityRepository.deleteAll(availabilities);

        User user = doctor.getUser();

        doctorRepository.delete(doctor);

        if (user != null) {
            userRepository.delete(user);
        }
    }

    private void validate(Doctor doctor) {

        if (doctor == null
                || doctor.getName() == null || doctor.getName().isBlank()
                || doctor.getSpecialization() == null
                || doctor.getSpecialization().isBlank()) {

            throw new BadRequestException(
                    "Doctor name and specialization are required");
        }
    }
}
