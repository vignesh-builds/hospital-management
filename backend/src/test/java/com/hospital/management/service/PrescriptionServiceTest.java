package com.hospital.management.service;

import com.hospital.management.dto.PrescriptionRequest;
import com.hospital.management.dto.PrescriptionResponse;
import com.hospital.management.exception.AppointmentValidationException;
import com.hospital.management.exception.BadRequestException;
import com.hospital.management.model.Appointment;
import com.hospital.management.model.AppointmentStatus;
import com.hospital.management.model.Doctor;
import com.hospital.management.model.Patient;
import com.hospital.management.model.Prescription;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.PrescriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrescriptionServiceTest {

    @Mock PrescriptionRepository prescriptionRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock AccessGuard accessGuard;

    PrescriptionService service;

    Doctor me;
    Doctor someoneElse;

    @BeforeEach
    void setUp() {
        service = new PrescriptionService(prescriptionRepository,
                appointmentRepository, accessGuard);
        me = doctor(1L);
        someoneElse = doctor(2L);
    }

    private Doctor doctor(long id) {
        Doctor d = new Doctor();
        d.setId(id);
        d.setName("Dr " + id);
        return d;
    }

    private Appointment appointment(Doctor doctor, AppointmentStatus status) {
        Patient patient = new Patient();
        patient.setId(10L);
        patient.setName("Ravi");
        Appointment a = new Appointment();
        a.setId(5L);
        a.setDoctor(doctor);
        a.setPatient(patient);
        a.setStatus(status);
        a.setAppointmentDate(LocalDate.of(2026, 11, 2));
        return a;
    }

    private PrescriptionRequest request() {
        return new PrescriptionRequest(5L, "BP 120/80", "Fever", "Viral fever",
                "Paracetamol 500mg 1-0-1 x 3 days", "Rest", 80.0);
    }

    @Test
    void doctorCannotPrescribeForAnotherDoctorsAppointment() {
        when(accessGuard.currentDoctor()).thenReturn(me);
        when(appointmentRepository.findById(5L))
                .thenReturn(Optional.of(appointment(someoneElse, AppointmentStatus.CONFIRMED)));

        assertThatThrownBy(() -> service.save(request()))
                .isInstanceOf(AccessDeniedException.class);
        verify(prescriptionRepository, never()).save(any());
    }

    @Test
    void prescriptionNeedsConfirmedOrCompletedAppointment() {
        when(accessGuard.currentDoctor()).thenReturn(me);
        when(appointmentRepository.findById(5L))
                .thenReturn(Optional.of(appointment(me, AppointmentStatus.BOOKED)));

        assertThatThrownBy(() -> service.save(request()))
                .isInstanceOf(AppointmentValidationException.class);
    }

    @Test
    void diagnosisAndMedicinesAreRequired() {
        assertThatThrownBy(() -> service.save(new PrescriptionRequest(
                5L, null, null, " ", "Paracetamol", null, null)))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.save(new PrescriptionRequest(
                5L, null, null, "Fever", "", null, null)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void negativeMedicineChargesAreRejected() {
        assertThatThrownBy(() -> service.save(new PrescriptionRequest(
                5L, null, null, "Fever", "Paracetamol", null, -1.0)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void doctorSavesPrescriptionForOwnConfirmedAppointment() {
        when(accessGuard.currentDoctor()).thenReturn(me);
        when(appointmentRepository.findById(5L))
                .thenReturn(Optional.of(appointment(me, AppointmentStatus.CONFIRMED)));
        when(prescriptionRepository.findByAppointmentId(5L)).thenReturn(Optional.empty());
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(i -> i.getArgument(0));

        PrescriptionResponse response = service.save(request());

        assertThat(response.patientId()).isEqualTo(10L);
        assertThat(response.doctorId()).isEqualTo(1L);
        assertThat(response.diagnosis()).isEqualTo("Viral fever");
        assertThat(response.medicineCharges()).isEqualTo(80.0);
    }

    @Test
    void savingAgainUpdatesTheExistingPrescription() {
        Prescription existing = new Prescription();
        existing.setId(77L);
        when(accessGuard.currentDoctor()).thenReturn(me);
        when(appointmentRepository.findById(5L))
                .thenReturn(Optional.of(appointment(me, AppointmentStatus.COMPLETED)));
        when(prescriptionRepository.findByAppointmentId(5L)).thenReturn(Optional.of(existing));
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(i -> i.getArgument(0));

        PrescriptionResponse response = service.save(request());

        assertThat(response.id()).isEqualTo(77L);
    }
}
