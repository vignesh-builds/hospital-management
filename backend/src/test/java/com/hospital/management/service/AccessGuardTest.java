package com.hospital.management.service;

import com.hospital.management.model.Doctor;
import com.hospital.management.model.Patient;
import com.hospital.management.model.User;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.DoctorRepository;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessGuardTest {

    @Mock UserRepository userRepository;
    @Mock PatientRepository patientRepository;
    @Mock DoctorRepository doctorRepository;
    @Mock AppointmentRepository appointmentRepository;

    AccessGuard guard;

    @BeforeEach
    void setUp() {
        guard = new AccessGuard(userRepository, patientRepository,
                doctorRepository, appointmentRepository);
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private User loginAs(String email, String role, long userId) {
        User user = new User();
        user.setId(userId);
        user.setEmail(email);
        user.setRole(role);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))));
        lenient().when(userRepository.findByEmailIgnoreCase(email))
                .thenReturn(Optional.of(user));
        return user;
    }

    private void patientProfile(long userId, long patientId) {
        Patient patient = new Patient();
        patient.setId(patientId);
        when(patientRepository.findByUserId(userId)).thenReturn(Optional.of(patient));
    }

    @Test
    void patientCanReadOwnBillsAndRecords() {
        loginAs("p1@x.com", "PATIENT", 10L);
        patientProfile(10L, 1L);

        assertThatCode(() -> guard.checkBillingAccess(1L)).doesNotThrowAnyException();
        assertThatCode(() -> guard.checkMedicalAccess(1L)).doesNotThrowAnyException();
    }

    @Test
    void patientCannotReadAnotherPatientsBills() {
        loginAs("p1@x.com", "PATIENT", 10L);
        patientProfile(10L, 1L);

        assertThatThrownBy(() -> guard.checkBillingAccess(2L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void patientCannotReadAnotherPatientsPrescriptions() {
        loginAs("p1@x.com", "PATIENT", 10L);
        patientProfile(10L, 1L);

        assertThatThrownBy(() -> guard.checkMedicalAccess(2L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void adminCanReadEverything() {
        loginAs("admin@x.com", "ADMIN", 1L);

        assertThatCode(() -> guard.checkBillingAccess(99L)).doesNotThrowAnyException();
        assertThatCode(() -> guard.checkMedicalAccess(99L)).doesNotThrowAnyException();
    }

    @Test
    void doctorCanReadRecordsOfOwnPatientsOnly() {
        loginAs("d1@x.com", "DOCTOR", 20L);
        Doctor doctor = new Doctor();
        doctor.setId(5L);
        when(doctorRepository.findByUserId(20L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.existsByDoctorIdAndPatientId(5L, 1L)).thenReturn(true);
        when(appointmentRepository.existsByDoctorIdAndPatientId(5L, 2L)).thenReturn(false);

        assertThatCode(() -> guard.checkMedicalAccess(1L)).doesNotThrowAnyException();
        assertThatThrownBy(() -> guard.checkMedicalAccess(2L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void doctorCanNeverReadBills() {
        loginAs("d1@x.com", "DOCTOR", 20L);

        assertThatThrownBy(() -> guard.checkBillingAccess(1L))
                .isInstanceOf(AccessDeniedException.class);
    }
}
