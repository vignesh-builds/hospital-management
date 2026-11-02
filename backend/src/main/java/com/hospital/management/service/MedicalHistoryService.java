package com.hospital.management.service;

import com.hospital.management.dto.MedicalHistoryResponse;
import com.hospital.management.dto.MedicalHistoryResponse.PatientInfo;
import com.hospital.management.dto.MedicalHistoryResponse.Visit;
import com.hospital.management.dto.PrescriptionResponse;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.model.Appointment;
import com.hospital.management.model.Bill;
import com.hospital.management.model.Patient;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.BillRepository;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MedicalHistoryService {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final BillRepository billRepository;
    private final PrescriptionService prescriptionService;
    private final AdmissionService admissionService;
    private final AccessGuard accessGuard;

    public MedicalHistoryService(PatientRepository patientRepository,
                                 AppointmentRepository appointmentRepository,
                                 PrescriptionRepository prescriptionRepository,
                                 BillRepository billRepository,
                                 PrescriptionService prescriptionService,
                                 AdmissionService admissionService,
                                 AccessGuard accessGuard) {
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.billRepository = billRepository;
        this.prescriptionService = prescriptionService;
        this.admissionService = admissionService;
        this.accessGuard = accessGuard;
    }

    @Transactional(readOnly = true)
    public MedicalHistoryResponse getMine() {
        return build(accessGuard.currentPatient().getId());
    }

    @Transactional(readOnly = true)
    public MedicalHistoryResponse getForPatient(Long patientId) {
        return build(patientId);
    }

    private MedicalHistoryResponse build(Long patientId) {
        accessGuard.checkMedicalAccess(patientId);

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        List<PrescriptionResponse> prescriptions =
                prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                        .stream().map(prescriptionService::toResponse).toList();

        Set<Long> prescribedAppointments = prescriptions.stream()
                .map(PrescriptionResponse::appointmentId)
                .collect(Collectors.toSet());

        List<Visit> visits = appointmentRepository.findByPatientId(patientId).stream()
                .sorted(Comparator
                        .comparing(Appointment::getAppointmentDate,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Appointment::getAppointmentTime,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .map(a -> new Visit(
                        a.getId(),
                        a.getAppointmentDate() == null ? null : a.getAppointmentDate().toString(),
                        a.getAppointmentTime() == null ? null : a.getAppointmentTime().toString(),
                        a.getStatus() == null ? null : a.getStatus().name(),
                        a.getDoctor() == null ? null : a.getDoctor().getName(),
                        a.getDoctor() == null ? null : a.getDoctor().getSpecialization(),
                        prescribedAppointments.contains(a.getId())))
                .toList();

        // Doctors may see the medical record but not the money side.
        boolean billingVisible = !"DOCTOR".equals(accessGuard.currentRole());
        List<Bill> bills = billingVisible
                ? billRepository.findByPatientId(patientId).stream()
                        .sorted(Comparator.comparing(Bill::getGeneratedDate,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                        .toList()
                : List.of();

        PatientInfo info = new PatientInfo(
                patient.getId(), patient.getName(), patient.getAge(),
                patient.getGender(), patient.getPhone(), patient.getEmail(),
                patient.getAddress());

        return new MedicalHistoryResponse(
                info, visits, prescriptions,
                admissionService.getByPatient(patientId),
                billingVisible, bills);
    }
}
