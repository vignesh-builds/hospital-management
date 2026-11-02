package com.hospital.management.service;

import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.model.Doctor;
import com.hospital.management.model.Patient;
import com.hospital.management.model.User;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.DoctorRepository;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Central place for "who is logged in" and "may they see this patient's data".
 * ADMIN: everything. PATIENT: only own data.
 * DOCTOR: only patients they have (or had) an appointment with.
 */
@Component
public class AccessGuard {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    public AccessGuard(UserRepository userRepository,
                       PatientRepository patientRepository,
                       DoctorRepository doctorRepository,
                       AppointmentRepository appointmentRepository) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public User currentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Not authenticated");
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public String currentRole() {
        String role = currentUser().getRole();
        return role != null && role.startsWith("ROLE_") ? role.substring(5) : role;
    }

    public boolean isAdmin() {
        return "ADMIN".equals(currentRole());
    }

    public Patient currentPatient() {
        return patientRepository.findByUserId(currentUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
    }

    public Doctor currentDoctor() {
        return doctorRepository.findByUserId(currentUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
    }

    /** Medical data (prescriptions, history): admin, own patient, or treating doctor. */
    public void checkMedicalAccess(Long patientId) {
        String role = currentRole();
        if ("ADMIN".equals(role)) {
            return;
        }
        if ("PATIENT".equals(role)) {
            requireSelf(patientId);
            return;
        }
        if ("DOCTOR".equals(role)) {
            Doctor doctor = currentDoctor();
            if (appointmentRepository.existsByDoctorIdAndPatientId(doctor.getId(), patientId)) {
                return;
            }
        }
        throw new AccessDeniedException("You are not allowed to view this patient's records");
    }

    /** Financial data (bills): admin or the patient themself. Doctors never. */
    public void checkBillingAccess(Long patientId) {
        String role = currentRole();
        if ("ADMIN".equals(role)) {
            return;
        }
        if ("PATIENT".equals(role)) {
            requireSelf(patientId);
            return;
        }
        throw new AccessDeniedException("You are not allowed to view these bills");
    }

    private void requireSelf(Long patientId) {
        if (!currentPatient().getId().equals(patientId)) {
            throw new AccessDeniedException("You can access only your own records");
        }
    }
}
