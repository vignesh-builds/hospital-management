package com.hospital.management.service;

import com.hospital.management.dto.PrescriptionRequest;
import com.hospital.management.dto.PrescriptionResponse;
import com.hospital.management.exception.AppointmentValidationException;
import com.hospital.management.exception.BadRequestException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.model.Appointment;
import com.hospital.management.model.AppointmentStatus;
import com.hospital.management.model.Doctor;
import com.hospital.management.model.Patient;
import com.hospital.management.model.Prescription;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.PrescriptionRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final AccessGuard accessGuard;

    public PrescriptionService(PrescriptionRepository prescriptionRepository,
                               AppointmentRepository appointmentRepository,
                               AccessGuard accessGuard) {
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.accessGuard = accessGuard;
    }

    /** Create, or update if the appointment already has a prescription. */
    @Transactional
    public PrescriptionResponse save(PrescriptionRequest request) {
        if (request == null || request.appointmentId() == null) {
            throw new BadRequestException("Appointment is required");
        }
        if (isBlank(request.diagnosis())) {
            throw new BadRequestException("Diagnosis is required");
        }
        if (isBlank(request.medicines())) {
            throw new BadRequestException("Please enter at least one medicine");
        }
        double charges = request.medicineCharges() == null ? 0.0 : request.medicineCharges();
        if (charges < 0) {
            throw new BadRequestException("Medicine charges cannot be negative");
        }

        Doctor doctor = accessGuard.currentDoctor();

        Appointment appointment = appointmentRepository
                .findById(request.appointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        // A doctor can write prescriptions only for their own appointments.
        if (appointment.getDoctor() == null
                || !appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new AccessDeniedException(
                    "You can prescribe only for your own appointments");
        }

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED
                && appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new AppointmentValidationException(
                    "Prescription can be written only for CONFIRMED or COMPLETED appointments");
        }

        Prescription prescription = prescriptionRepository
                .findByAppointmentId(appointment.getId())
                .orElseGet(Prescription::new);

        prescription.setAppointment(appointment);
        prescription.setDoctor(doctor);
        prescription.setPatient(appointment.getPatient());
        prescription.setVitals(trim(request.vitals()));
        prescription.setSymptoms(trim(request.symptoms()));
        prescription.setDiagnosis(request.diagnosis().trim());
        prescription.setMedicines(request.medicines().trim());
        prescription.setAdvice(trim(request.advice()));
        prescription.setMedicineCharges(charges);
        if (prescription.getId() == null) {
            prescription.setCreatedAt(LocalDateTime.now());
        }

        return toResponse(prescriptionRepository.save(prescription));
    }

    /** Returns null when no prescription has been written yet. */
    @Transactional(readOnly = true)
    public PrescriptionResponse getByAppointment(Long appointmentId) {
        return prescriptionRepository.findByAppointmentId(appointmentId)
                .map(p -> {
                    accessGuard.checkMedicalAccess(p.getPatient().getId());
                    return toResponse(p);
                })
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getByPatient(Long patientId) {
        accessGuard.checkMedicalAccess(patientId);
        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getMine() {
        Patient patient = accessGuard.currentPatient();
        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())
                .stream().map(this::toResponse).toList();
    }

    public PrescriptionResponse toResponse(Prescription p) {
        Appointment a = p.getAppointment();
        Patient patient = p.getPatient();
        Doctor doctor = p.getDoctor();
        return new PrescriptionResponse(
                p.getId(),
                a == null ? null : a.getId(),
                a == null || a.getAppointmentDate() == null ? null : a.getAppointmentDate().toString(),
                a == null || a.getAppointmentTime() == null ? null : a.getAppointmentTime().toString(),
                patient.getId(),
                patient.getName(),
                patient.getAge(),
                patient.getGender(),
                doctor.getId(),
                doctor.getName(),
                doctor.getSpecialization(),
                doctor.getQualification(),
                p.getVitals(),
                p.getSymptoms(),
                p.getDiagnosis(),
                p.getMedicines(),
                p.getAdvice(),
                p.getMedicineCharges() == null ? 0.0 : p.getMedicineCharges(),
                p.getCreatedAt() == null ? null : p.getCreatedAt().toString()
        );
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }
}
