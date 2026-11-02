package com.hospital.management.service;

import com.hospital.management.dto.AdmissionResponse;
import com.hospital.management.dto.AdmitRequest;
import com.hospital.management.exception.BadRequestException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.model.Admission;
import com.hospital.management.model.AdmissionStatus;
import com.hospital.management.model.Bed;
import com.hospital.management.model.Bill;
import com.hospital.management.model.Patient;
import com.hospital.management.repository.AdmissionRepository;
import com.hospital.management.repository.BedRepository;
import com.hospital.management.repository.BillRepository;
import com.hospital.management.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class AdmissionService {

    private final AdmissionRepository admissionRepository;
    private final BedRepository bedRepository;
    private final PatientRepository patientRepository;
    private final BillRepository billRepository;
    private final BillService billService;
    private final AccessGuard accessGuard;

    @Value("${app.timezone:Asia/Kolkata}")
    private String timezone;

    public AdmissionService(AdmissionRepository admissionRepository,
                            BedRepository bedRepository,
                            PatientRepository patientRepository,
                            BillRepository billRepository,
                            BillService billService,
                            AccessGuard accessGuard) {
        this.admissionRepository = admissionRepository;
        this.bedRepository = bedRepository;
        this.patientRepository = patientRepository;
        this.billRepository = billRepository;
        this.billService = billService;
        this.accessGuard = accessGuard;
    }

    @Transactional
    public AdmissionResponse admit(AdmitRequest request) {
        if (request == null || request.patientId() == null || request.bedId() == null) {
            throw new BadRequestException("Patient and bed are required");
        }
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        Bed bed = bedRepository.findById(request.bedId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found"));

        if (bed.isOccupied()
                || admissionRepository.existsByBedIdAndStatus(bed.getId(), AdmissionStatus.ADMITTED)) {
            throw new BadRequestException("Bed " + bed.getBedNumber() + " is already occupied");
        }
        if (admissionRepository.existsByPatientIdAndStatus(patient.getId(), AdmissionStatus.ADMITTED)) {
            throw new BadRequestException("This patient is already admitted to a bed");
        }

        Admission admission = new Admission();
        admission.setPatient(patient);
        admission.setBed(bed);
        admission.setReason(request.reason() == null ? null : request.reason().trim());
        admission.setDailyRate(bed.getDailyRate() == null ? 0.0 : bed.getDailyRate());
        admission.setAdmittedAt(now());
        admission.setStatus(AdmissionStatus.ADMITTED);

        bed.setOccupied(true);
        bed.setStatus("OCCUPIED");
        bed.setReservedPatient(null);
        bed.setReservedUntil(null);
        bed.setPatient(patient);
        bedRepository.save(bed);

        return toResponse(admissionRepository.save(admission));
    }

    /** Frees the bed, calculates the room charges and creates the bill. */
    @Transactional
    public AdmissionResponse discharge(Long admissionId) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Admission not found"));
        if (admission.getStatus() != AdmissionStatus.ADMITTED) {
            throw new BadRequestException("This patient is already discharged");
        }

        LocalDateTime dischargedAt = now();
        int days = billedDays(admission.getAdmittedAt(), dischargedAt);
        double rate = admission.getDailyRate() == null ? 0.0 : admission.getDailyRate();

        admission.setDischargedAt(dischargedAt);
        admission.setBilledDays(days);
        admission.setRoomCharges(roomCharges(days, rate));
        admission.setStatus(AdmissionStatus.DISCHARGED);
        Admission saved = admissionRepository.save(admission);

        Bed bed = saved.getBed();
        bed.setOccupied(false);
        bed.setStatus("AVAILABLE");
        bed.setPatient(null);
        bedRepository.save(bed);

        billService.createForAdmission(saved);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AdmissionResponse> getAll() {
        return admissionRepository.findAllByOrderByAdmittedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AdmissionResponse> getMine() {
        Patient patient = accessGuard.currentPatient();
        return admissionRepository.findByPatientIdOrderByAdmittedAtDesc(patient.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AdmissionResponse> getByPatient(Long patientId) {
        accessGuard.checkMedicalAccess(patientId);
        return admissionRepository.findByPatientIdOrderByAdmittedAtDesc(patientId)
                .stream().map(this::toResponse).toList();
    }

    // ---------------------------------------------------------
    // Billing rules (public + static so they can be unit tested)
    // ---------------------------------------------------------

    /** Calendar days between admission and discharge, minimum 1 (same-day stay = 1 day). */
    public static int billedDays(LocalDateTime admittedAt, LocalDateTime dischargedAt) {
        long days = ChronoUnit.DAYS.between(
                admittedAt.toLocalDate(), dischargedAt.toLocalDate());
        return (int) Math.max(1, days);
    }

    public static double roomCharges(int days, double dailyRate) {
        return Math.round(days * dailyRate * 100.0) / 100.0;
    }

    private LocalDateTime now() {
        return LocalDateTime.now(ZoneId.of(timezone));
    }

    public AdmissionResponse toResponse(Admission a) {
        Long billId = billRepository.findByAdmissionId(a.getId())
                .map(Bill::getId).orElse(null);
        return new AdmissionResponse(
                a.getId(),
                a.getPatient().getId(),
                a.getPatient().getName(),
                a.getBed().getId(),
                a.getBed().getBedNumber(),
                a.getBed().getWardType(),
                a.getReason(),
                a.getDailyRate(),
                a.getAdmittedAt() == null ? null : a.getAdmittedAt().toString(),
                a.getDischargedAt() == null ? null : a.getDischargedAt().toString(),
                a.getBilledDays(),
                a.getRoomCharges(),
                a.getStatus().name(),
                billId
        );
    }
}
